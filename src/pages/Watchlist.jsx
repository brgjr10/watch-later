import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToWatchlist, toggleWatched, removeWatchlistItem } from "../services/watchlistService";
import { getImageUrl } from "../api/tmdb";
import { Check, X, Play, Plus, Bookmark, Clock } from "lucide-react";

const getProviderLogoPath = (provider) => {
  const paths = {
    "Netflix": "/providers/netflix.svg",
    "Disney+": "/providers/disneyplus.svg",
    "Hulu": "/providers/hulu.svg",
    "Amazon Prime Video": "/providers/amazonprime.svg",
    "HBO Max": "/providers/hbomax.svg",
    "YouTube": "/providers/youtube.svg",
  };
  return paths[provider] || null;
};

const getYouTubeThumbnail = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return null;
};

const getProviderColor = (provider) => {
  const colors = {
    "Netflix": "bg-red-600",
    "Disney+": "bg-blue-700",
    "Hulu": "bg-green-600",
    "Amazon Prime Video": "bg-blue-500",
    "HBO Max": "bg-purple-600",
    "YouTube": "bg-red-500",
  };
  return colors[provider] || "bg-slate-600";
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

export default function Watchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToWatchlist(user.uid, setItems);
    return unsubscribe;
  }, [user]);

  const counts = {
    all: items.length,
    unwatched: items.filter(i => !i.watched).length,
    watched: items.filter(i => i.watched).length,
  };

  const filteredItems = items.filter((item) => {
    if (filter === "watched") return item.watched;
    if (filter === "unwatched") return !item.watched;
    return true;
  });

  const handleToggleWatched = async (itemId, watched) => {
    await toggleWatched(user.uid, itemId, !watched);
  };

  const handleRemove = async (itemId) => {
    await removeWatchlistItem(user.uid, itemId);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white pb-20">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Watchlist</h1>
          <Link
            to="/search"
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-white" />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 mb-6">
          {["all", "unwatched", "watched"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20">
            <div className="flex">
              {/* Poster/Thumbnail */}
              <div className="relative flex-shrink-0">
                {item.type === "youtube" ? (
                  <div className="w-24 h-36">
                    <img
                      src={getYouTubeThumbnail(item.url)}
                      alt="YouTube thumbnail"
                      className="w-full h-full object-contain rounded-l-2xl"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/240x360?text=YT";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                ) : item.poster ? (
                  <div className="w-24 h-36">
                    <img
                      src={getImageUrl(item.poster)}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-l-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-36 bg-gray-100 dark:bg-gray-800 rounded-l-2xl flex items-center justify-center">
                    <Bookmark className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                {item.watched && (
                  <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full p-0.5 shadow-md">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  {item.type === "youtube" && item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-gray-900 dark:text-white text-base leading-tight line-clamp-1"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight line-clamp-1">{item.title}</h3>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                    {item.type === "tv" ? "TV" : item.type === "youtube" ? "YouTube" : "Movie"}
                  </span>

                  {/* Duration/Runtime */}
                  {item.duration && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <Clock className="w-3 h-3" />
                      {item.type === "youtube"
                        ? formatDuration(item.duration)
                        : formatRuntime(item.duration)}
                    </span>
                  )}

                  {item.provider && item.type !== "youtube" && (
                    <>
                      {getProviderLogoPath(item.provider) ? (
                        <img
                          src={getProviderLogoPath(item.provider)}
                          alt={item.provider}
                          className="w-4 h-4"
                        />
                      ) : null}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getProviderColor(item.provider)}`}>
                        {item.provider}
                      </span>
                    </>
                  )}
                  {item.type === "youtube" && (
                    <div className="flex items-center gap-1.5">
                      <img src="/providers/youtube.svg" alt="YouTube" className="w-4 h-4" />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white">
                        YouTube
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-center pr-3 gap-2">
                <button
                  onClick={() => handleToggleWatched(item.id, item.watched)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    item.watched
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700"
                  }`}
                >
                  {item.watched ? "Watched" : "Mark watched"}
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-24 px-4">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4">
            <Bookmark className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">Your watchlist is empty</p>
          <Link
            to="/search"
            className="px-6 py-3 bg-primary rounded-full font-medium shadow-lg shadow-primary/30 active:scale-95 transition-transform text-white"
          >
            Add your first item
          </Link>
        </div>
      )}
    </div>
  );
}