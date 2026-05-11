import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToWatchlist, toggleWatched, removeWatchlistItem } from "../services/watchlistService";
import { getImageUrl } from "../api/tmdb";
import { Check, Play, Plus, ExternalLink } from "lucide-react";

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

const FilterTabs = ({ filter, setFilter, counts }) => (
  <div className="flex gap-1 mb-4">
    {[
      { key: "all", label: "All" },
      { key: "unwatched", label: "To Watch" },
      { key: "watched", label: "Watched" },
    ].map((tab) => (
      <button
        key={tab.key}
        onClick={() => setFilter(tab.key)}
        className={`px-3 py-1 text-xs font-medium rounded transition-all ${
          filter === tab.key
            ? "bg-blue-600 text-white"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
        }`}
      >
        {tab.label} ({counts[tab.key]})
      </button>
    ))}
  </div>
);

const WatchlistItem = ({ item, onToggleWatched, onRemove }) => {
  return (
    <div className="group bg-slate-800 rounded-lg p-3 flex gap-3 items-center">
      <div className="relative flex-shrink-0">
        {item.type === "youtube" ? (
          <div className="w-28 h-16 rounded-md overflow-hidden bg-slate-700">
            <img
              src={getYouTubeThumbnail(item.url)}
              alt="YouTube thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/112x64?text=YT";
              }}
            />
            {item.url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-4 h-4 text-white" fill="white" />
              </div>
            )}
          </div>
        ) : (
          item.poster && (
            <img
              src={getImageUrl(item.poster)}
              alt={item.title}
              className="w-10 h-14 object-cover rounded-md"
            />
          )
        )}
        {item.watched && (
          <div className="absolute -top-1 -right-1 bg-green-600 rounded-full p-0.5">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          {item.type === "youtube" && item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm text-white hover:text-blue-400 transition-colors truncate"
            >
              {item.title}
              <ExternalLink className="inline w-3 h-3 ml-0.5 opacity-60" />
            </a>
          ) : (
            <h3 className="font-medium text-sm text-white truncate">{item.title}</h3>
          )}
          <span className="text-xs text-slate-400 flex-shrink-0">
            {item.type === "tv" ? "TV" : item.type === "youtube" ? "YT" : "Movie"}
          </span>
        </div>

        {item.provider && item.type !== "youtube" && (
          <div className="flex items-center gap-1.5">
            {getProviderLogoPath(item.provider) ? (
              <img
                src={getProviderLogoPath(item.provider)}
                alt={item.provider}
                className="w-4 h-4"
              />
            ) : (
              <span className="text-xs">{getProviderIcon(item.provider)}</span>
            )}
            <span className={`inline-block px-1.5 py-0 text-xs rounded ${getProviderColor(item.provider)}`}>
              {item.provider}
            </span>
          </div>
        )}

        {item.type === "youtube" && (
          <div className="flex items-center gap-1.5">
            <img src="/providers/youtube.svg" alt="YouTube" className="w-4 h-4" />
            <span className="inline-block px-1.5 py-0 text-xs rounded bg-red-500">
              YouTube
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => onToggleWatched(item.id, item.watched)}
          className={`px-2 py-1 text-xs rounded ${
            item.watched ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          {item.watched ? "✓" : "Watched"}
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="px-2 py-1 text-xs bg-red-600 rounded hover:bg-red-700"
        >
          ×
        </button>
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
    <div className="container mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">My Watchlist</h1>
        <Link
          to="/search"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add
        </Link>
      </header>

      <FilterTabs filter={filter} setFilter={setFilter} counts={counts} />

      <div className="space-y-2">
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
        <p className="text-center text-slate-400 mt-8 text-sm">
          Your watchlist is empty. <Link to="/search" className="text-blue-400">Add something</Link>
        </p>
      )}
    </div>
  );
}
