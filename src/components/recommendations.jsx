import { useCallback, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getWatchProviders, getMediaDetails, getImageUrl } from "../api/tmdb";
import { addWatchlistItem } from "../services/watchlistService";
import { Loader2, RefreshCw, Film } from "lucide-react";

export default function RecommendationSection({
  watchedItems,
  recommendations,
  onFetchRecommendations,
  onHide,
}) {
  const { user } = useAuth();
  const [addingStates, setAddingStates] = useState({});

  const handleAdd = useCallback(
    async (item) => {
      if (!user) return;
      setAddingStates((prev) => ({ ...prev, [item.id]: true }));
      try {
        const providers = await getWatchProviders(item.type, item.id);
        const usProviders =
          providers.results?.US?.flatrate ||
          providers.results?.US?.rent ||
          [];
        const provider = usProviders[0]?.provider_name || "Unknown";
        const logoPath = usProviders[0]?.logo_path ?? null;

        let runtime = null;
        if (item.type === "movie" || item.type === "tv") {
          try {
            const details = await getMediaDetails(item.type, item.id);
            if (details.runtime != null) {
              runtime = details.runtime;
            } else if (
              details.episode_run_time &&
              details.episode_run_time.length > 0
            ) {
              runtime = details.episode_run_time[0];
            }
          } catch (e) {
            console.error("Failed to fetch runtime:", e);
          }
        }

        await addWatchlistItem(user.uid, {
          tmdbId: item.id,
          title: item.title || item.name,
          type: item.media_type === "tv" ? "tv" : "movie",
          poster: item.poster_path ?? null,
          overview: item.overview ?? null,
          provider,
          logoPath,
          duration: runtime,
        });
      } catch (err) {
        console.error("Failed to add recommendation:", err);
      } finally {
        setAddingStates((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }
    },
    [user]
  );

  const isAdding = (id) => !!addingStates[id];

  return (
    <div className="mt-10 animate-fade-in">
      {watchedItems.length > 0 && recommendations.length === 0 && (
        <div className="mt-8 animate-fade-in">
          <button
            onClick={onFetchRecommendations}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.97] transition-all mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Get Recommendations Based on Watched
          </button>
        </div>
      )}

      {recommendations.length > 0 && (
        <>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-500" />
            Recommended For You
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendations.map((item) => (
              <button
                key={`rec-${item.id}`}
                onClick={() => handleAdd(item)}
                disabled={isAdding(item.id)}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-md shadow-gray-200/20 dark:shadow-gray-900/20 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 text-left group disabled:opacity-70"
              >
                {item.poster_path ? (
                  <img
                    src={getImageUrl(item.poster_path)}
                    alt={item.title || item.name}
                    className="w-full aspect-[2/3] object-cover rounded-t-2xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center rounded-t-2xl">
                    <Film className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="p-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1">
                    {item.title || item.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    {item.media_type === "tv" ? "TV Show" : "Movie"}
                    {item.vote_average &&
                      ` · ★ ${item.vote_average.toFixed(1)}`}
                  </p>
                  <p className="text-[10px] text-indigo-400 dark:text-indigo-300 mt-1 font-medium">
                    {isAdding(item.id) ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Adding...
                      </span>
                    ) : (
                      "+ Add to watchlist"
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={onHide}
            className="mt-4 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Hide recommendations
          </button>
        </>
      )}
    </div>
  );
}