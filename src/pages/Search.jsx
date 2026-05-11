import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { searchTitles, getWatchProviders, getImageUrl } from "../api/tmdb";
import { addWatchlistItem } from "../services/watchlistService";

export default function Search() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualProvider, setManualProvider] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchTitles(query);
      setResults(
        data.results
          .filter((r) => r.media_type !== "person")
          .map((r) => ({
            id: r.id,
            title: r.name || r.title,
            type: r.media_type === "tv" ? "tv" : "movie",
            poster: r.poster_path,
            overview: r.overview,
          }))
      );
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleSelect = async (item) => {
    const providers = await getWatchProviders(item.type, item.id);
    const usProviders = providers.results?.US?.flatrate || [];

    const provider = usProviders[0]?.provider_name || "Unknown";
    const logoPath = usProviders[0]?.logo_path || null;

    await addWatchlistItem(user.uid, {
      tmdbId: item.id,
      title: item.title,
      type: item.type,
      poster: item.poster,
      provider,
      logoPath,
    });

    navigate("/");
  };

  const isYouTubeUrl = (url) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const extractYouTubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const fetchYouTubeTitle = async (url) => {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        return data.title;
      }
    } catch (e) {
      console.error("Could not fetch YouTube title", e);
    }
    return null;
  };

  const handleManualAdd = async () => {
    if (!manualTitle) return;

    let provider = manualProvider;
    let title = manualTitle;
    let youtubeUrl = null;

    // If it's a YouTube URL, extract info
    if (isYouTubeUrl(manualTitle)) {
      const videoId = extractYouTubeId(manualTitle);
      if (videoId) {
        provider = "YouTube";
        youtubeUrl = manualTitle;
        // Fetch actual video title
        const videoTitle = await fetchYouTubeTitle(manualTitle);
        title = videoTitle || videoId;
      }
    }

    await addWatchlistItem(user.uid, {
      tmdbId: Date.now(),
      title: title,
      type: youtubeUrl ? "youtube" : "movie",
      provider: provider || "Unknown",
      poster: null,
      url: youtubeUrl,
    });

    navigate("/");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <Link to="/" className="text-blue-400">← Back</Link>
        <h1 className="text-xl font-bold">Find a Title</h1>
      </div>

      {!manualMode ? (
        <>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies or TV shows..."
                className="flex-1 px-4 py-2 bg-slate-800 rounded-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 rounded-lg"
              >
                {loading ? "..." : "Search"}
              </button>
            </div>
          </form>

          <button
            onClick={() => setManualMode(true)}
            className="mb-4 text-blue-400"
          >
            Can't find it? Add manually
          </button>

          <div className="flex flex-col gap-3 max-w-lg mx-auto">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-lg p-3 hover:bg-slate-700"
              >
                <div className="flex gap-3">
                  {item.poster && (
                    <img
                      src={getImageUrl(item.poster)}
                      alt={item.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-sm text-slate-400">
                      {item.type === "tv" ? "TV Show" : "Movie"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelect(item)}
                    className="self-start px-3 py-1 bg-blue-600 rounded text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <input
            type="text"
            placeholder="Title or YouTube URL"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 rounded-lg"
          />
          <input
            type="text"
            placeholder="Provider (optional - YouTube links auto-fill)"
            value={manualProvider}
            onChange={(e) => setManualProvider(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={handleManualAdd}
              className="flex-1 px-4 py-2 bg-blue-600 rounded-lg"
            >
              Add
            </button>
            <button
              onClick={() => setManualMode(false)}
              className="px-4 py-2 bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}