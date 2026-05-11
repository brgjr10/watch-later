import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { searchTitles, getWatchProviders, getImageUrl, getMediaDetails, formatRuntime, getYouTubeVideoDetails } from "../api/tmdb";
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
  const [error, setError] = useState(null);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchTitles(searchQuery);
      setResults(
        data.results
          .filter((r) => r.media_type !== "person")
          .map((r) => ({
            id: r.id,
            title: r.name || r.title,
            type: r.media_type === "tv" ? "tv" : "movie",
            poster: r.poster_path,
            overview: r.overview ?? null,
          }))
      );
    } catch (error) {
      console.error(error);
      setError("Search failed. Please try again.");
      setResults([]);
    }
    setLoading(false);
  };

  // Debounce live search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (item) => {
    try {
      const providers = await getWatchProviders(item.type, item.id);
      const usProviders = providers.results?.US?.flatrate || [];

      const provider = usProviders[0]?.provider_name || "Unknown";
      const logoPath = usProviders[0]?.logo_path ?? null;

      let runtime = null;
      if (item.type === "movie" || item.type === "tv") {
        try {
          const details = await getMediaDetails(item.type, item.id);
          if (details.runtime != null) {
            runtime = details.runtime;
          } else if (details.episode_run_time && details.episode_run_time.length > 0) {
            runtime = details.episode_run_time[0];
          } else {
            runtime = null;
          }
        } catch (error) {
          console.error("Failed to fetch runtime:", error);
        }
      }

      await addWatchlistItem(user.uid, {
        tmdbId: item.id,
        title: item.title,
        type: item.type,
        poster: item.poster ?? null,
        overview: item.overview ?? null,
        provider,
        logoPath,
        duration: runtime,
      });

      navigate("/");
    } catch (error) {
      console.error("Failed to add item:", error);
      setError("Failed to add item. Please try again.");
    }
  };

   const extractYouTubeId = (url) => {
     const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/);
     return match ? match[1] : null;
   };

   const isYouTubeUrl = (url) => {
     return url.includes("youtube.com") || url.includes("youtu.be");
   };

   const fetchYouTubeInfo = async (url) => {
     const videoId = extractYouTubeId(url);
     if (!videoId) return { title: null, duration: null };

     // Use YouTube Data API to get both title and duration
     const details = await getYouTubeVideoDetails(videoId);
     if (details.duration || details.title) {
       return details;
     }

     // Fallback to noembed for title only
     try {
       const response = await fetch(
         `https://noembed.com/embed?url=${encodeURIComponent(url)}`
       );
       if (response.ok) {
         const data = await response.json();
         return { title: data.title, duration: null };
       }
     } catch (e) {
       console.error("Could not fetch YouTube info", e);
     }
     return { title: null, duration: null };
   };

  const handleManualAdd = async () => {
    if (!manualTitle) return;

    let provider = manualProvider;
    let title = manualTitle;
    let youtubeUrl = null;
    let youtubeDuration = null;

    // If it's a YouTube URL, extract info
    if (isYouTubeUrl(manualTitle)) {
      const videoId = extractYouTubeId(manualTitle);
      if (videoId) {
        provider = "YouTube";
        youtubeUrl = manualTitle;
        // Fetch video title and duration
        const info = await fetchYouTubeInfo(manualTitle);
        title = info.title || videoId;
        youtubeDuration = info.duration;
      }
    }

     await addWatchlistItem(user.uid, {
       tmdbId: Date.now(),
       title: title,
       type: youtubeUrl ? "youtube" : "movie",
       provider: provider || "Unknown",
       poster: null,
       url: youtubeUrl,
       duration: youtubeDuration ?? null,
     });

    navigate("/");
  };

   return (
     <div className="container mx-auto px-4 py-8">
       <div className="flex justify-between items-center mb-4">
         <Link to="/" className="text-blue-400">← Back</Link>
         <h1 className="text-xl font-bold">Find a Title</h1>
       </div>

       {error && (
         <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
           {error}
         </div>
       )}

       {!manualMode ? (
         <>
           <div className="mb-6">
             <input
               type="text"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               placeholder="Search movies or TV shows..."
               className="w-full px-4 py-2 bg-slate-800 rounded-lg"
               autoFocus
             />
             {loading && <p className="mt-2 text-sm text-slate-400">Searching...</p>}
           </div>

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
                     className="self-start px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500 active:scale-95 transition-transform"
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