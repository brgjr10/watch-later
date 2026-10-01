import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoFile = (relative) =>
  readFileSync(fileURLToPath(new URL(`../${relative}`, import.meta.url)), "utf8");

const indexHtml = repoFile("index.html");
const hostHeaders = repoFile("public/_headers");

// The CSP is duplicated as a meta tag and in the host `_headers` file on
// purpose: static hosts vary in whether they read the meta tag. Both must keep
// the same hardening, so both are asserted here.
describe("WATCHLATER-APP-006 the app ships security headers", () => {
  it("index.html declares a referrer policy", () => {
    expect(indexHtml).toMatch(/<meta name="referrer" content="no-referrer"/);
  });

  it("index.html declares a Content-Security-Policy", () => {
    expect(indexHtml).toMatch(/http-equiv="Content-Security-Policy"/);
    expect(indexHtml).toContain("default-src 'self'");
  });

  it("the CSP blocks inline and third-party script, plugins and framing", () => {
    const csp = indexHtml.slice(indexHtml.indexOf("Content-Security-Policy"));
    expect(csp).toContain("script-src 'self';");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("script-src 'self' https:");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("the CSP allows exactly the third parties the app actually calls", () => {
    const csp = indexHtml.slice(indexHtml.indexOf("Content-Security-Policy"));
    expect(csp).toContain("img-src 'self' data: https://image.tmdb.org https://img.youtube.com");
    for (const origin of [
      "https://api.themoviedb.org",
      "https://firestore.googleapis.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
    ]) {
      expect(csp).toContain(origin);
    }
  });

  it("every cross-origin image in the app opts out of the referrer", () => {
    const files = [
      "src/pages/Watchlist.jsx",
      "src/pages/Search.jsx",
      "src/pages/Recommendations.jsx",
    ];
    let found = 0;
    for (const file of files) {
      const source = repoFile(file);
      for (const match of source.matchAll(/<img\b[\s\S]*?\/>/g)) {
        found += 1;
        expect(match[0], `${file}: ${match[0].split("\n")[0]}`).toContain('referrerpolicy="no-referrer"');
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it("the static-host header file carries the headers a meta tag cannot set", () => {
    expect(hostHeaders).toContain("X-Content-Type-Options: nosniff");
    expect(hostHeaders).toContain("X-Frame-Options: DENY");
    expect(hostHeaders).toContain("Strict-Transport-Security:");
    expect(hostHeaders).toContain("Content-Security-Policy:");
  });
});

// Deployments split on whether the host honours the meta tag or the `_headers`
// file, so a one-sided edit removes CSP from half of them and still passes every
// build, lint and test run. Parsing both and comparing them is the only guard.
describe("the two CSP delivery paths cannot drift apart", () => {
  const cspFromHtml = () =>
    indexHtml
      .match(/Content-Security-Policy"\s*\r?\n\s*content="([^"]+)"/)[1]
      .replace(/\s+/g, " ")
      .trim();

  const cspFromHeaders = () =>
    hostHeaders.match(/^\s*Content-Security-Policy:\s*(.+)$/m)[1].trim();

  it("index.html and public/_headers carry an identical policy", () => {
    expect(cspFromHtml()).toBe(cspFromHeaders());
  });

  it("both paths allow the Firebase endpoints the app really calls", () => {
    // firebase/auth and firebase/firestore resolve these hosts at runtime. A
    // missing one surfaces as a network error in the browser only, which no
    // build step can catch, so the allow-list is asserted explicitly.
    for (const csp of [cspFromHtml(), cspFromHeaders()]) {
      for (const origin of [
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
      ]) {
        expect(csp).toContain(origin);
      }
    }
  });
});