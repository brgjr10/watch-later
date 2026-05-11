import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToWatchlist, toggleWatched, removeWatchlistItem } from "../services/watchlistService";
import { getImageUrl } from "../api/tmdb";

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
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <h1 className="text-lg sm:text-xl font-bold">My Watchlist</h1>
        <Link
          to="/search"
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs sm:text-sm"
        >
          + Add
        </Link>
      </div>

      <div className="flex gap-1 mb-2">
        {["all", "unwatched", "watched"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-0.5 rounded text-xs ${
              filter === f ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

        <div className="grid grid-cols-1 gap-2">
         {filteredItems.map((item) => (
            <div key={item.id} className="bg-slate-800 rounded-lg p-2 sm:p-3 flex gap-2 sm:gap-3 items-start">
            {item.type === "youtube" ? (
               <img
                 src={getYouTubeThumbnail(item.url)}
                 alt="YouTube thumbnail"
                 className="w-28 h-16 sm:w-32 sm:h-[72px] object-cover rounded flex-shrink-0"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/120x68?text=YT";
                }}
              />
            ) : (
              item.poster && (
                <img
                  src={getImageUrl(item.poster)}
                  alt={item.title}
                  className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded flex-shrink-0"
                />
              )
            )}
            <div className="flex-1 min-w-0">
              {item.type === "youtube" && item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-400 hover:text-blue-300 break-words text-sm leading-tight line-clamp-2"
                >
                  {item.title}
                </a>
              ) : item.type === "youtube" ? (
                <h3 className="font-semibold text-sm leading-tight line-clamp-2">{item.title}</h3>
              ) : (
                <h3 className="font-semibold truncate text-sm leading-tight">{item.title}</h3>
              )}
              <p className="text-xs text-slate-400 mt-0.5">
                {item.type === "tv" ? "TV" : item.type === "youtube" ? "YouTube" : "Movie"}
              </p>
               {item.provider && item.type !== "youtube" && (
                 <div className="flex items-center gap-1 mt-0.5">
                   {getProviderLogoPath(item.provider) ? (
                     <img
                       src={getProviderLogoPath(item.provider)}
                       alt={item.provider}
                       className="w-4 h-4 flex-shrink-0"
                     />
                   ) : (
                     <span className="text-[10px]">{getProviderIcon(item.provider)}</span>
                   )}
                   <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded ${getProviderColor(item.provider)} whitespace-nowrap`}>
                     {item.provider}
                   </span>
                 </div>
               )}
                {item.type === "youtube" && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <img
                      src="/providers/youtube.svg"
                      alt="YouTube"
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-red-500 whitespace-nowrap">
                      YouTube
                    </span>
                  </div>
                )}
            </div>
             <div className="flex flex-col gap-1 min-w-[56px]">
              <button
                onClick={() => handleToggleWatched(item.id, item.watched)}
                className={`px-1.5 py-0.5 text-[10px] rounded w-full ${
                  item.watched ? "bg-green-600" : "bg-slate-600"
                }`}
              >
                {item.watched ? "✓" : "Watched"}
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                className="px-1.5 py-0.5 text-[10px] bg-red-600 rounded w-full"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <p className="text-center text-slate-400 mt-8">
          Your watchlist is empty. <Link to="/search" className="text-blue-400">Add something</Link>
        </p>
      )}
    </div>
  );
}
