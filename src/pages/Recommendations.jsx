import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getRecommendations, getWatchProviders, getMediaDetails, getImageUrl } from "../api/tmdb";
import { addWatchlistItem } from "../services/watchlistService";
import { useNavigate } from "react-router-dom";
import { Loader2, Film, Plus, ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { getDocs, collection, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

function RecCard({ item, onAdd, isAdding }) {
  return (
    <button
      onClick={() => onAdd(item)}
      disabled={isAdding}
      className="bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-md shadow-gray-200/20 dark:shadow-gray-900/20 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 text-left group disabled:opacity-70"
    >
      {item.poster_path ? (
        <img
          src={getImageUrl(item.poster_path)}
          alt={item.title || item.name}
          className="w-full aspect-[2/3] object-cover rounded-t-2xl"
          loading="lazy"
          onError={(e) => {
            e.target.classList.add("hidden");
            const fb = e.target.nextElementSibling;
            if (fb) fb.classList.remove("hidden");
          }}
        />
      ) : null}
      <div className="w-full aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center rounded-t-2xl hidden">
        <Film className="w-8 h-8 text-gray-400" />
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1">
          {item.title || item.name}
        </h4>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
          {item.media_type === "tv" ? "TV Show" : "Movie"}
          {item.vote_average && ` · ★ ${item.vote_average.toFixed(1)}`}
        </p>
        <p className="text-[10px] text-indigo-400 dark:text-indigo-300 mt-1 font-medium">
          {isAdding ? (
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
  );
}

export default function RecommendationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [addingStates, setAddingStates] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const [watchedItems, setWatchedItems] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
  }, [user, navigate]);

  const fetchRecommendationsRef = useRef(null);

  // Auto-fetch recommendations after watched items are loaded
  const initialFetchRef = useRef(false);

  const fetchRecommendations = useCallback(async () => {
    if (!watchedItems.length) return;
    if (fetchRecommendationsRef.current) {
      clearTimeout(fetchRecommendationsRef.current);
    }
    setFetching(true);
    fetchRecommendationsRef.current = setTimeout(async () => {
      try {
        const unique = [...new Map(watchedItems.map((i) => [i.type + i.id, i])).values()];
        const shuffled = [...unique];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const pick = shuffled.slice(0, 3);
        const recs = [];
        for (const item of pick) {
          try {
            const data = await getRecommendations(
              item.type === "youtube" ? "movie" : item.type,
              item.tmdbId
            );
            if (data.results) {
              recs.push(...data.results.slice(0, 4));
            }
          } catch (e) {
            console.error("Failed to get recommendations for", item.title, e);
          }
        }
        const seen = new Set();
        const uniqueRecs = recs.filter((r) => {
          const key = r.id + r.media_type;
          if (seen.has(key) || r.media_type === "person") return false;
          seen.add(key);
          return true;
        });
        setRecommendations((prev) => {
          const merged = [...prev, ...uniqueRecs];
          const deduped = [...new Map(merged.map((r) => [r.id + r.media_type, r])).values()];
          return deduped;
        });
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setFetching(false);
      }
    }, 200);
  }, [watchedItems]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchRecommendationsRef.current) {
        clearTimeout(fetchRecommendationsRef.current);
      }
    };
  }, []);

  // Load watched items from Firestore on mount
   const loadWatchedItems = useCallback(async () => {
     if (!user) return;
     setLoading(true);
     try {
       const q = query(
         collection(db, "users", user.uid, "watchlist"),
         where("watched", "==", true)
       );
       const snapshot = await getDocs(q);
       const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
       // Sort by addedAt descending
       items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
       setWatchedItems(items);
     } catch (err) {
       console.error("Failed to load watched items:", err);
     } finally {
       setLoading(false);
     }
   }, [user]);

  useEffect(() => {
    loadWatchedItems(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [loadWatchedItems]);

  useEffect(() => {
    if (!loading && watchedItems.length > 0 && !initialFetchRef.current) {
      initialFetchRef.current = true;
      const timer = setTimeout(() => {
        fetchRecommendations();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading, watchedItems.length, fetchRecommendations]);

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

  const showMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const showLess = () => {
    setVisibleCount(10);
  };

  const visibleRecs = recommendations.slice(0, visibleCount);

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate("/")}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors rounded-xl hover:bg-gray-800"
            aria-label="Back to watchlist"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recommended For You
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
          Based on {watchedItems.length} watched {watchedItems.length === 1 ? "title" : "titles"}
        </p>
      </header>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
              <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700" />
              <div className="p-3 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 && !fetching ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center">
            <Film className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Recommendations Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Mark some titles as "Seen" in your Watchlist, then come back here to get recommendations based on what you've watched.
          </p>
          <button
            onClick={loadWatchedItems}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
              {visibleRecs.map((item) => (
                <RecCard
                  key={`rec-${item.id}`}
                  item={item}
                  onAdd={handleAdd}
                  isAdding={!!addingStates[item.id]}
                />
              ))}
            </div>
          </div>

          {visibleRecs.length < recommendations.length && (
            <button
              onClick={showMore}
              className="mt-6 flex items-center gap-1.5 text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors mx-auto"
            >
              View More ({recommendations.length - visibleRecs.length} more)
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
          {visibleRecs.length > 10 && visibleRecs.length === recommendations.length && (
            <button
              onClick={showLess}
              className="mt-4 flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mx-auto"
            >
              Show Less
              <ChevronUp className="w-4 h-4" />
            </button>
          )}

          {/* Fetch More */}
          <div className="text-center mt-8">
            <button
              onClick={fetchRecommendations}
              disabled={fetching}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.97] transition-all mx-auto disabled:opacity-70"
            >
              {fetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {fetching ? "Fetching..." : "Get More Recommendations"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}