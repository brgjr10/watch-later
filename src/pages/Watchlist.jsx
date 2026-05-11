import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscribeToWatchlist, toggleWatched, removeWatchlistItem } from "../services/watchlistService";
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Watchlist</h1>
        <Link
          to="/search"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          + Add Title
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {["all", "unwatched", "watched"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded ${
              filter === f ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-slate-800 rounded-lg p-4">
            {item.poster && (
              <img
                src={getImageUrl(item.poster)}
                alt={item.title}
                className="w-full h-48 object-cover rounded mb-2"
              />
            )}
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-slate-400">{item.type === "tv" ? "TV" : "Movie"}</p>
            {item.provider && (
              <p className="text-xs text-blue-400 mt-1">{item.provider}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleToggleWatched(item.id, item.watched)}
                className={`flex-1 px-2 py-1 text-sm rounded ${
                  item.watched ? "bg-green-600" : "bg-slate-600"
                }`}
              >
                {item.watched ? "Watched" : "Mark Watched"}
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                className="px-2 py-1 text-sm bg-red-600 rounded"
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