import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  searchTitles,
  getWatchProviders,
  getImageUrl,
  getMediaDetails,
  getYouTubeVideoDetails,
} from "../api/tmdb";
import { addWatchlistItem } from "../services/watchlistService";
import {
  Search as SearchIcon,
  Plus,
  X,
  Loader2,
  Film,
  Tv,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

function YoutubeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
  );
}

function SearchInput({ value, onChange, autoFocus, placeholder, className }) {
  return (
    <div className={className}>
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-2 border-transparent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700/50 outline-none transition-all text-base"
      />
    </div>
  );
}

function ResultCard({ item, onAdd, isAdding, isAdded }) {
  const typeLabel = item.type === "tv" ? "TV Show" : "Movie";

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-md shadow-gray-200/20 dark:shadow-gray-900/20 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
      <div className="relative">
        {item.poster ? (
          <img
            src={getImageUrl(item.poster)}
            alt={item.title}
            className="w-full aspect-[2/3] object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <Film className="w-10 h-10 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-black/50 text-white">
            {typeLabel}
          </span>
        </div>
        {item.year && (
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] text-white">
            {item.year}
          </div>
        )}
        {item.vote_average && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
            <span className="text-[10px] text-yellow-400">★</span>
            <span className="text-[10px] text-white">{item.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 mb-2">
          {item.title}
        </h3>
        <button
          onClick={() => onAdd(item)}
          disabled={isAdding || isAdded}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            isAdded
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : isAdding
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 cursor-wait"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-500/20 active:scale-[0.97] group-hover:shadow-xl group-hover:shadow-indigo-500/30"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" /> Added
            </>
          ) : isAdding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add to Watchlist
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ManualAddForm({ onAdd, loading, onCancel }) {
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [type, setType] = useState("movie");
  const [url, setUrl] = useState("");
  const [titleError, setTitleError] = useState("");

  const handleTypeChange = useCallback((newUrl) => {
    const isYouTube = newUrl.includes("youtube.com") || newUrl.includes("youtu.be");
    setType(isYouTube ? "youtube" : "movie");
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    setTitleError("");
    await onAdd({ title: title.trim(), type, provider: provider.trim(), url: url.trim() });
    setTitle("");
    setProvider("");
    setUrl("");
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Manually</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleError("");
              handleTypeChange(e.target.value);
            }}
            placeholder="Title or YouTube URL"
            className={`w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              titleError ? "border-red-400" : "border-transparent"
            }`}
          />
          {titleError && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {titleError}
            </p>
          )}
        </div>

        {type === "youtube" && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 text-sm text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
            <YoutubeIcon className="w-4 h-4" />
            YouTube link detected — will be added as YouTube type
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setType("movie")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              type === "movie"
                ? "bg-indigo-600 text-white shadow shadow-indigo-500/20"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            <Film className="w-4 h-4 inline mr-1" /> Movie
          </button>
          <button
            onClick={() => setType("tv")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              type === "tv"
                ? "bg-indigo-600 text-white shadow shadow-indigo-500/20"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            <Tv className="w-4 h-4 inline mr-1" /> TV Show
          </button>
        </div>

        {type !== "youtube" && (
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="Provider/Streaming Service (optional)"
            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add to Watchlist
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  { query: "Inception", emoji: "🎯", desc: "Mind-bending thriller" },
  { query: "The Dark Knight", emoji: "🦇", desc: "Iconic superhero film" },
  { query: "Breaking Bad", emoji: "🧪", desc: "Legendary TV series" },
  { query: "Interstellar", emoji: "🚀", desc: "Space epic adventure" },
  { query: "Stranger Things", emoji: "🔮", desc: "Sci-fi horror series" },
  { query: "Parasite", emoji: "🎭", desc: "Award-winning thriller" },
  { query: "The Matrix", emoji: "💊", desc: "Sci-fi classic" },
  { query: "Game of Thrones", emoji: "🐉", desc: "Epic fantasy series" },
];

export default function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [addingStates, setAddingStates] = useState({});
  const [error, setError] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchTitles(searchQuery);
      setResults(
        (data.results || []).filter((r) => r.media_type !== "person").map((r) => ({
          id: r.id,
          title: r.name || r.title,
          type: r.media_type === "tv" ? "tv" : "movie",
          poster: r.poster_path,
          overview: r.overview ?? null,
          year: r.release_date?.slice(0, 4) || r.first_air_date?.slice(0, 4) || null,
          vote_average: r.vote_average ?? null,
        }))
      );
      if (data.results?.length === 0) {
        setError("No results found. Try a different search term.");
      }
    } catch (err) {
      console.error(err);
      setError("Search failed. Please try again.");
      setResults([]);
    }
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleAdd = useCallback(
    async (item) => {
      setAddingStates((prev) => ({ ...prev, [item.id]: true }));
      setError(null);
      try {
        const providers = await getWatchProviders(item.type, item.id);
        const usProviders = providers.results?.US?.flatrate || providers.results?.US?.rent || [];
        const providerItem = usProviders[0]?.provider_name || "Unknown";
        const logoPath = usProviders[0]?.logo_path ?? null;

        let runtime = null;
        if (item.type === "movie" || item.type === "tv") {
          try {
            const details = await getMediaDetails(item.type, item.id);
            if (details.runtime != null) {
              runtime = details.runtime;
            } else if (details.episode_run_time && details.episode_run_time.length > 0) {
              runtime = details.episode_run_time[0];
            }
          } catch (err) {
            console.error("Failed to fetch runtime:", err);
          }
        }

        await addWatchlistItem(user.uid, {
          tmdbId: item.id,
          title: item.title,
          type: item.type,
          poster: item.poster ?? null,
          overview: item.overview ?? null,
          provider: providerItem,
          logoPath,
          duration: runtime,
        });

        setAddedIds((prev) => new Set([...prev, item.id]));
        setTimeout(() => {
          setAddedIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
        }, 2000);
      } catch (err) {
        console.error("Failed to add item:", err);
        setError("Failed to add item. It may already be in your watchlist.");
      } finally {
        setAddingStates((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    [user]
  );

const handleManualAdd = useCallback(
     async (manualItem) => {
       setAddingStates((prev) => ({ ...prev, manual: true }));
       setError(null);
       try {
         let videoId = null;
         if (manualItem.type === "youtube") {
           const match = manualItem.url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
           videoId = match ? match[1] : null;
         }

         let youtubeDuration = null;
         let videoTitle = manualItem.title;

         if (manualItem.type === "youtube" && videoId) {
           try {
             const details = await getYouTubeVideoDetails(videoId);
             youtubeDuration = details.duration || null;
             if (details.title) {
               videoTitle = details.title;
             } else if (/^https?:\/\//.test(videoTitle)) {
               videoTitle = null;
             }
           } catch (err) {
             console.error("YouTube details fetch failed:", err);
             // If title is a URL and we failed to fetch a real title, clear it
             if (/^https?:\/\//.test(videoTitle)) {
               videoTitle = null;
             }
           }
         }

         if (manualItem.type !== "youtube") {
           videoTitle = manualItem.title;
         }

         await addWatchlistItem(user.uid, {
           tmdbId: Date.now(),
           title: videoTitle,
           type: manualItem.type,
           provider: manualItem.type === "youtube" ? "YouTube" : manualItem.provider || "Unknown",
           poster: null,
           url: manualItem.type === "youtube" ? manualItem.url : undefined,
           duration: youtubeDuration,
         });

        setManualMode(false);
      } catch (err) {
        console.error("Failed to add manually:", err);
        setError("Failed to add item. Please try again.");
      } finally {
        setAddingStates((prev) => ({ ...prev, manual: false }));
      }
    },
    [user]
  );

  // Determine the active type based on URL input (no effect needed)
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" />
          Discover
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Search for movies, TV shows, or YouTube videos to add to your watchlist
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 text-xs mt-1">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-8">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Search movies, TV shows..."
          className="mb-4"
        />

        {/* Quick Suggestions */}
        {!query && !manualMode && (
          <div className="animate-fade-in">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider font-medium">
              Popular Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((sugg) => (
                <button
                  key={sugg.query}
                  onClick={() => {
                    setQuery(sugg.query);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300 transition-all"
                >
                  <span>{sugg.emoji}</span>
                  {sugg.query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {!manualMode ? (
        <>
          {/* Loading */}
          {loading && query.length >= 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching...
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state - no query */}
          {!loading && !query.trim() && (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center">
                <SearchIcon className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Start Searching
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Type a movie or TV show name above, or try one of the popular suggestions to discover something new.
              </p>
            </div>
          )}

          {/* Results grid */}
          {!loading && query.trim() && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {results.map((item) => (
                <ResultCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onAdd={handleAdd}
                  isAdding={!!addingStates[item.id]}
                  isAdded={addedIds.has(item.id)}
                />
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && query.trim() && results.length === 0 && !error && (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Results Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                We couldn't find anything matching "{query}". Try different keywords or add it manually below.
              </p>
              <button
                onClick={() => setManualMode(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Manually Instead
              </button>
            </div>
          )}
        </>
      ) : (
        <ManualAddForm
          onAdd={handleManualAdd}
          loading={addingStates.manual}
          onCancel={() => setManualMode(false)}
        />
      )}

      {/* Footer link */}
      {!manualMode && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setManualMode(true)}
            className={`text-sm flex items-center gap-1.5 mx-auto transition-all ${
              manualMode
                ? "text-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-indigo-500"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {manualMode ? "Back to Search" : "Can't find it? Add manually"}
          </button>
        </div>
      )}

      {/* Back button */}
      <div className="mt-12 flex justify-center">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          Back to Watchlist
        </Link>
      </div>
    </div>
  );
}