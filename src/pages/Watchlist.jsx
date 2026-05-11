import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToWatchlist, toggleWatched, removeWatchlistItem } from "../services/watchlistService";
import { getImageUrl } from "../api/tmdb";
import { Check, X, Play, Film, Tv, Plus } from "lucide-react";

const getProviderIcon = (provider) => {
  const icons = {
    "Netflix": "🎬",
    "Disney+": "🏰",
    "Hulu": "🟢",
    "Amazon Prime Video": "📦",
    "HBO Max": "🔵",
    "YouTube": "▶️",
  };
  return icons[provider] || "📺";
};

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
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
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

const FilterTabs = ({ filter, setFilter }) => (
  <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg w-fit mb-4">
    {[
      { key: "all", label: "All" },
      { key: "unwatched", label: "To Watch" },
      { key: "watched", label: "Watched" },
    ].map((tab) => (
      <button
        key={tab.key}
        onClick={() => setFilter(tab.key)}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          filter === tab.key
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

const WatchlistItem = ({ item, onToggleWatched, onRemove }) => {
  const getTypeIcon = () => {
    if (item.type === "youtube") return <Play className="w-3 h-3" />;
    if (item.type === "tv") return <Tv className="w-3 h-3" />;
    return <Film className="w-3 h-3" />;
  };

  return (
    <div className="group bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          {item.type === "youtube" ? (
            <div className="w-24 sm:w-32 aspect-video rounded-lg overflow-hidden bg-slate-700">
              <img
                src={getYouTubeThumbnail(item.url)}
                alt="YouTube thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/120x68?text=YT";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white" fill="white" />
              </div>
            </div>
          ) : (
            item.poster && (
              <img
                src={getImageUrl(item.poster)}
                alt={item.title}
                className="w-12 sm:w-16 aspect-[2/3] object-cover rounded-lg"
              />
            )
          )}
          {item.watched && (
            <div className="absolute top-1 right-1 bg-green-600 rounded-full p-0.5">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            {item.type === "youtube" && item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-lg text-white hover:text-blue-400 transition-colors line-clamp-1"
              >
                {item.title}
              </a>
            ) : (
              <h3 className="font-semibold text-lg text-white line-clamp-1">{item.title}</h3>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
            <span className="flex items-center gap-1">
              {getTypeIcon()}
              {item.type === "tv" ? "TV Series" : item.type === "youtube" ? "YouTube" : "Movie"}
            </span>
          </div>

          {item.provider && item.type !== "youtube" && (
            <div className="flex items-center gap-2">
              {getProviderLogoPath(item.provider) ? (
                <img
                  src={getProviderLogoPath(item.provider)}
                  alt={item.provider}
                  className="w-5 h-5"
                />
              ) : (
                <span className="text-lg">{getProviderIcon(item.provider)}</span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${getProviderColor(item.provider)}`}>
                {item.provider}
              </span>
            </div>
          )}

          {item.type === "youtube" && (
            <div className="flex items-center gap-2">
              <img src="/providers/youtube.svg" alt="YouTube" className="w-5 h-5" />
              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-500">
                YouTube
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => onToggleWatched(item.id, item.watched)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              item.watched
                ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {item.watched ? "Watched" : "Mark Watched"}
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            aria-label="Remove from watchlist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Watchlist</h1>
          <p className="text-slate-400 text-sm">
            {filteredItems.length} {filter === "all" ? "items" : filter === "watched" ? "watched" : "to watch"}
          </p>
        </div>
        <Link
          to="/search"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Add
        </Link>
      </header>

      <FilterTabs filter={filter} setFilter={setFilter} />

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <WatchlistItem
            key={item.id}
            item={item}
            onToggleWatched={handleToggleWatched}
            onRemove={handleRemove}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Film className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 mb-2">Your watchlist is empty</p>
          <Link to="/search" className="text-blue-400 hover:text-blue-300 font-medium">
            Add something to watch
          </Link>
        </div>
      )}
    </div>
  );
}
