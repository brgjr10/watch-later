import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToWatchlist, toggleWatched, removeWatchlistItem } from "../services/watchlistService";
import { getImageUrl } from "../api/tmdb";
import { getImageUrl } from "../api/tmdb";

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">My Watchlist</h1>
        <Link
          to="/search"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
        >
          + Add
        </Link>
      </div>

      <div className="flex gap-1 mb-3">
        {["all", "unwatched", "watched"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded text-sm ${
              filter === f ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-slate-800 rounded-lg p-3 flex gap-3">
            {item.poster && item.type !== "youtube" && (
              <img
                src={getImageUrl(item.poster)}
                alt={item.title}
                className="w-16 h-24 object-cover rounded"
              />
            )}
            {item.type === "youtube" && (
              <div className="w-16 h-24 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">YT</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{item.title}</h3>
              <p className="text-xs text-slate-400">
                {item.type === "tv" ? "TV" : item.type === "youtube" ? "YouTube" : "Movie"}
              </p>
              {item.provider && item.type !== "youtube" && (
                <p className="text-xs text-blue-400 mt-1">{item.provider}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleToggleWatched(item.id, item.watched)}
                className={`px-3 py-1 text-xs rounded ${
                  item.watched ? "bg-green-600" : "bg-slate-600"
                }`}
              >
                {item.watched ? "✓" : "Watched"}
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                className="px-3 py-1 text-xs bg-red-600 rounded"
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