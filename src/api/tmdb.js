const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const BASE_URL = "https://api.themoviedb.org/3";

export const searchTitles = async (query) => {
  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("TMDB search failed");
  return res.json();
};

export const getWatchProviders = async (type, id) => {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}/watch/providers?api_key=${API_KEY}`
  );
  if (!res.ok) throw new Error("Watch providers fetch failed");
  return res.json();
};

export const getMediaDetails = async (type, id) => {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=external_ids`
  );
  if (!res.ok) throw new Error("Failed to fetch media details");
  return res.json();
};

export const getTrending = async (type = "all", timeWindow = "week") => {
  const res = await fetch(
    `${BASE_URL}/trending/${type}/${timeWindow}?api_key=${API_KEY}`
  );
  if (!res.ok) throw new Error("Trending fetch failed");
  return res.json();
};

export const getRecommendations = async (type, id) => {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}/recommendations?api_key=${API_KEY}&language=en-US&page=1`
  );
  if (!res.ok) throw new Error("Recommendations fetch failed");
  return res.json();
};

export const getYouTubeVideoDetails = async (videoId) => {
  try {
    const res = await fetch(
      `/api/youtube?videoId=${encodeURIComponent(videoId)}`
    );
    if (!res.ok) {
      console.error("YouTube API error:", res.status, res.statusText);
      return { title: null, duration: null };
    }
    const data = await res.json();
    if (data.items?.[0]) {
      const item = data.items[0];
      const title = item.snippet?.title || null;
      const duration = item.contentDetails?.duration
        ? parseISO8601Duration(item.contentDetails.duration)
        : null;
      return { title, duration };
    }
  } catch (e) {
    console.error("YouTube API fetch error:", e);
  }
  return { title: null, duration: null };
};

function parseISO8601Duration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hrs = parseInt(match[1] || 0);
  const mins = parseInt(match[2] || 0);
  const secs = parseInt(match[3] || 0);
  const totalSeconds = hrs * 3600 + mins * 60 + secs;
  return totalSeconds;
}

export const getImageUrl = (path) => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
};

export const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};
