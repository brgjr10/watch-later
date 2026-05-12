import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getImageUrl,
} from "../api/tmdb";
import {
  subscribeToWatchlist,
  toggleWatched as toggleWatchedService,
  removeWatchlistItem as removeWatchlistItemService,
  updateWatchlistItem,
} from "../services/watchlistService";
import {
  Check,
  X,
  Plus,
  Bookmark,
  Clock,
  Trash2,
  Search as SearchIcon,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  Book,
} from "lucide-react";

const extractYouTubeId = (url) => {
  if (!url) return null;
  // Ensure we're working with a string
  const str = String(url);
  // Try common YouTube URL patterns
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{10,12})/,
    /youtu\.be\/([a-zA-Z0-9_-]{10,12})/,
    /\/embed\/([a-zA-Z0-9_-]{10,12})/,
    /\/shorts\/([a-zA-Z0-9_-]{10,12})/,
    /\/live\/([a-zA-Z0-9_-]{10,12})/,
    // youtu.be without path separator (e.g., youtu.be/dQw4w9WgXcQ)
    /youtu\.be\.{0,3}([a-zA-Z0-9_-]{10,12})/,
  ];
  for (const p of patterns) {
    const m = str.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
};

const getYouTubeThumbnail = (url) => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

const getProviderColor = (provider) => {
  const colors = {
    Netflix: "bg-red-600",
    "Disney+": "bg-blue-700",
    Hulu: "bg-emerald-600",
    "Amazon Prime Video": "bg-amber-600",
    "HBO Max": "bg-purple-600",
    YouTube: "bg-red-500",
    Apple: "bg-gray-500",
    Peacock: "bg-teal-500",
  };
  return colors[provider] || "bg-slate-600";
};

const normalizeYouTubeTitle = (title) => {
  if (!title) return null;
  // If the title is a URL (starts with http or contains youtube domain), return null so fallback is used
  if (/^https?:\/\//.test(title) || title.includes("youtube.com") || title.includes("youtu.be")) {
    return null;
  }
  return title;
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

function SkeletonItem({ grid }) {
  if (grid) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden">
      <div className="flex">
        <div className="w-20 h-36 bg-gray-200 dark:bg-gray-700 rounded-l-2xl flex-shrink-0" />
        <div className="flex-1 p-4 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="flex gap-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center pt-20 px-4 animate-fade-in">
      <div className="w-24 h-24 mb-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl animate-pulse-glow" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
          <PlayIcon className="w-10 h-10 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Your watchlist is empty
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        Start discovering movies and TV shows to watch. Add items from the Discover page or search for something specific.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          to="/search"
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full font-medium shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform text-white flex items-center gap-2 hover:shadow-xl hover:shadow-indigo-500/40"
        >
          <Plus className="w-4 h-4" />
          Add Something to Watch
        </Link>
      </div>
      <p className="mt-8 text-sm text-gray-400 dark:text-gray-500">
        Tips: You can search for movies, TV shows, or even YouTube videos!
      </p>
    </div>
  );
}

function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" {...props}>
      <polygon points="5 3 19 12 5 21" />
    </svg>
  );
}

function ListItem({ item, isSelected, isSelectionMode, onToggleSelect, onToggleWatched, onRemove, onSaveNote, expandedNotes, onToggleNotes }) {
  const isExpanded = expandedNotes.has(item.id);
  const [noteText, setNoteText] = useState(item.note || "");
  return (
    <div
      className={`bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20 transition-all duration-200 ${
        isSelected ? "ring-2 ring-indigo-500" : ""
      }`}
    >
      <div className="flex items-center min-h-[100px]">
        {isSelectionMode && (
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={() => onToggleSelect(item.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
            </button>
          </div>
        )}

        <div className="relative flex-shrink-0 w-20 h-28 sm:w-24 sm:h-36">
          {item.type === "youtube" ? (
            <>
              {getYouTubeThumbnail(item.url) ? (
                <img
                  src={getYouTubeThumbnail(item.url)}
                  alt={item.title && !item.title.startsWith("http") ? item.title : "YouTube Video"}
                  className="w-full h-full object-cover rounded-l-2xl"
                  onError={(e) => {
                    const parent = e.target.parentElement;
                    const fb = parent?.querySelector(".youtube-fallback");
                    if (fb) fb.classList.remove("hidden");
                    e.target.classList.add("hidden");
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-l-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                </div>
              )}
              <div
                className="hidden absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-l-2xl flex items-center justify-center youtube-fallback"
              >
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              </div>
            </>
          ) : item.poster ? (
            <img
              src={getImageUrl(item.poster)}
              alt={item.title}
              className="w-full h-full object-cover rounded-l-2xl"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-l-2xl flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-gray-400" />
            </div>
          )}

          {item.watched && (
            <div className="absolute top-1.5 right-1.5 bg-green-500/90 backdrop-blur-sm rounded-full p-0.5 shadow-md">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}

          <div className="absolute bottom-1.5 left-1.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-black/60 text-white backdrop-blur-sm">
              {item.type === "tv" ? "TV" : item.type === "youtube" ? "YT" : "MOV"}
            </span>
          </div>
        </div>

        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            {item.type === "youtube" && item.url ? (
<a
                 href={item.url}
                 target="_blank"
                 rel="noopener noreferrer"
                 onClick={(e) => isSelectionMode && e.preventDefault()}
                 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 hover:underline"
              >
                 {normalizeYouTubeTitle(item.title) || "YouTube Video"}
              </a>
            ) : (
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1">
                {item.title}
              </h3>
            )}
            <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {item.addedAt
                ? new Date(item.addedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <span className="text-[11px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">
              {item.type === "tv" ? "TV Show" : item.type === "youtube" ? "YouTube" : "Movie"}
            </span>

            {item.duration && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Clock className="w-3 h-3" />
                {item.type === "youtube"
                  ? formatDuration(item.duration)
                  : formatRuntime(item.duration)}
              </span>
            )}

            {item.provider && item.type !== "youtube" && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${getProviderColor(item.provider)} text-white`}
              >
                {item.provider}
              </span>
            )}
            {item.type === "youtube" && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">
                YouTube
              </span>
            )}
          </div>

          {item.overview && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
              {item.overview}
            </p>
          )}

          {item.note && !isExpanded && (
            <p className="text-xs text-indigo-400 dark:text-indigo-300 mt-1 italic truncate">
              📝 {item.note}
            </p>
          )}

          {isExpanded && (
            <div className="mt-2 animate-fade-in">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note (e.g., Episode 5, remember the twist ending...)"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                rows={2}
              />
              <button
                onClick={() => {
                  onSaveNote(item.id, noteText);
                  onToggleNotes(item.id);
                }}
                className="mt-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Save Note
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center pr-3 gap-2 flex-shrink-0">
          <button
            onClick={() => onToggleWatched(item.id, item.watched)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              item.watched
                ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {item.watched ? (
              <>
                <Eye className="w-3 h-3" /> Seen
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" />
              </>
            )}
          </button>
          {!isSelectionMode && (
            <>
              <button
                onClick={() => onRemove(item.id)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleNotes(item.id)}
                className={`w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all ${
                  item.note ? "text-indigo-400" : ""
                }`}
                title="Add/View note"
              >
                <Book className="w-4 h-4" />
              </button>
            </>
          )}
          </div>
      </div>
    </div>
  );
}

function GridItem({ item, isSelected, isSelectionMode, onToggleSelect, onToggleWatched, onRemove, onSaveNote, expandedNotes, onToggleNotes }) {
  const isExpanded = expandedNotes.has(item.id);
  const [noteText, setNoteText] = useState(item.note || "");
  return (
    <div
      className={`bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20 transition-all duration-300 group ${
        isSelected ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950" : ""
      }`}
    >
      <div className="relative">
        {isSelectionMode && (
          <div className="absolute top-2 left-2 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(item.id);
              }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                isSelected
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "border-white bg-black/40 text-white/0 hover:text-white/100"
              }`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {item.type === "youtube" ? (
          <>
{getYouTubeThumbnail(item.url) ? (
                 <img
                   src={getYouTubeThumbnail(item.url)}
                   alt={normalizeYouTubeTitle(item.title) || "YouTube Video"}
                   className="w-full aspect-[2/3] object-cover"
                   onError={(e) => {
                     e.target.classList.add("hidden");
                     const fb = e.target.nextElementSibling;
                     if (fb) fb.classList.remove("hidden");
                   }}
                 />
            ) : (
              <div className="absolute inset-0 bg-gray-300 dark:bg-gray-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              </div>
            )}
            <div
              className="absolute inset-0 bg-gray-300 dark:bg-gray-800 flex items-center justify-center hidden"
            >
              <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            </div>
          </>
        ) : item.poster ? (
          <img
            src={getImageUrl(item.poster)}
            alt={item.title}
            className="w-full aspect-[2/3] object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <Bookmark className="w-10 h-10 text-gray-400" />
          </div>
        )}

        {!isSelectionMode && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatched(item.id, item.watched);
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    item.watched
                      ? "bg-green-600/90 text-white"
                      : "bg-white/90 text-gray-900 hover:bg-white"
                  }`}
                >
                  {item.watched ? (
                    <>
                      <Eye className="w-4 h-4" /> Seen
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="w-10 h-10 bg-white/90 hover:bg-red-500/90 text-gray-700 hover:text-white rounded-lg flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleNotes(item.id);
                  }}
                  className={`w-10 h-10 bg-white/90 hover:bg-indigo-500/90 text-gray-700 hover:text-white rounded-lg flex items-center justify-center transition-all ${item.note ? "text-indigo-400" : ""}`}
                  title="Add/View note"
                >
                  <Book className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {item.watched && (
          <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-md">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}

        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-black/50 text-white">
            {item.type === "tv" ? "TV" : item.type === "youtube" ? "YT" : "MOV"}
          </span>
        </div>
      </div>

<div className="p-3">
         <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-1">
           {normalizeYouTubeTitle(item.title) || "YouTube Video"}
         </h3>
         <div className="flex items-center gap-1.5 mt-1 flex-wrap">
           <span className="text-[10px] text-gray-500 dark:text-gray-400">
             {item.type === "tv" ? "TV Show" : item.type === "youtube" ? "YouTube" : "Movie"}
             {item.provider && item.type !== "youtube" && ` · ${item.provider}`}
           </span>
           {item.duration && (
             <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
               <Clock className="w-3 h-3" />
               {item.type === "youtube"
                 ? formatDuration(item.duration)
                 : formatRuntime(item.duration)}
             </span>
           )}
         </div>
         {item.note && !isExpanded && (
           <p className="text-[10px] text-indigo-400 dark:text-indigo-300 mt-1 italic truncate">
             📝 {item.note}
           </p>
         )}
         {isExpanded && (
           <div className="mt-2 animate-fade-in">
             <textarea
               value={noteText}
               onChange={(e) => setNoteText(e.target.value)}
               placeholder="Add a note..."
               className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
               rows={2}
             />
             <button
               onClick={() => {
                 onSaveNote(item.id, noteText);
                 onToggleNotes(item.id);
               }}
               className="mt-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1"
             >
               <Check className="w-3 h-3" /> Save Note
             </button>
           </div>
         )}
       </div>
    </div>
  );
}

export default function Watchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("unwatched");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("addedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("list");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setLoading(false); // eslint-disable-line react-hooks/set-state-in-effect
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToWatchlist(user.uid, (fetchedItems) => {
      setItems(fetchedItems);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const counts = useMemo(
    () => ({
      all: items.length,
      unwatched: items.filter((i) => !i.watched).length,
      watched: items.filter((i) => i.watched).length,
    }),
    [items]
  );

  const handleToggleWatched = useCallback(
    (itemId, currentWatched) => {
      toggleWatchedService(user.uid, itemId, !currentWatched);
    },
    [user]
  );

  const handleRemove = useCallback(
    (itemId) => {
      removeWatchlistItemService(user.uid, itemId);
    },
    [user]
  );

  const handleBulkDelete = useCallback(() => {
    if (!user || selectedItems.size === 0) return;
    Array.from(selectedItems).forEach((id) => {
      removeWatchlistItemService(user.uid, id);
    });
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  }, [user, selectedItems]);

  const handleBulkMarkWatched = useCallback(() => {
    if (!user || selectedItems.size === 0) return;
    Array.from(selectedItems).forEach((id) => {
      toggleWatchedService(user.uid, id, true);
    });
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  }, [user, selectedItems]);

  const handleSaveNote = useCallback(async (itemId, note) => {
    if (!user) return;
    await updateWatchlistItem(user.uid, itemId, { note });
  }, [user]);

  const toggleNotes = useCallback((itemId) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  // Filter, search, and sort items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply filter
    if (filter === "watched") {
      filtered = filtered.filter((i) => i.watched);
    } else if (filter === "unwatched") {
      filtered = filtered.filter((i) => !i.watched);
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.type && i.type.toLowerCase().includes(q)) ||
          (i.provider && i.provider.toLowerCase().includes(q))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return sortOrder === "asc"
            ? (a.title || "").localeCompare(b.title || "")
            : (b.title || "").localeCompare(a.title || "");
        case "type":
          return sortOrder === "asc"
            ? (a.type || "").localeCompare(b.type || "")
            : (b.type || "").localeCompare(a.type || "");
        case "addedAt":
          return sortOrder === "asc"
            ? (a.addedAt || 0) - (b.addedAt || 0)
            : (b.addedAt || 0) - (a.addedAt || 0);
        case "watched":
          return sortOrder === "asc"
            ? Number(a.watched || false) - Number(b.watched || false)
            : Number(b.watched || false) - Number(a.watched || false);
        case "provider":
          return sortOrder === "asc"
            ? (a.provider || "").localeCompare(b.provider || "")
            : (b.provider || "").localeCompare(a.provider || "");
        case "duration": {
            const getDur = (it) => {
              if (!it.duration) return 0;
              return it.duration;
            };
            return sortOrder === "asc"
              ? getDur(a) - getDur(b)
              : getDur(b) - getDur(a);
          }
        default:
          return sortOrder === "asc"
            ? (a.addedAt || 0) - (b.addedAt || 0)
            : (b.addedAt || 0) - (a.addedAt || 0);
      }
    });

    return sorted;
  }, [items, filter, searchQuery, sortBy, sortOrder]);

  const handleToggleSelectItem = useCallback((itemId) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="pt-8 pb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {filter === "unwatched"
              ? "What to Watch"
              : filter === "watched"
              ? "Watched"
              : "Your Watchlist"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === "unwatched"
              ? `${counts.unwatched} ${counts.unwatched === 1 ? "title" : "titles"} left to enjoy`
              : filter === "watched"
              ? `${counts.watched} completed`
              : `${counts.all} total`}
          </p>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => {
              setFilter("all");
              setIsSelectionMode(false);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => {
              setFilter("unwatched");
              setIsSelectionMode(false);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "unwatched"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            🎬 To Watch ({counts.unwatched})
          </button>
          <button
            onClick={() => {
              setFilter("watched");
              setIsSelectionMode(false);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === "watched"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            ✅ Watched ({counts.watched})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, type, or provider..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
                className="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                title={`Sort: ${sortOrder === "desc" ? "Descending" : "Ascending"}`}
              >
                {sortOrder === "desc" ? (
                  <SortDesc className="w-4 h-4" />
                ) : (
                  <SortAsc className="w-4 h-4" />
                )}
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm text-gray-700 dark:text-gray-300 pr-3 outline-none cursor-pointer"
              >
                <option value="addedAt">Date Added</option>
                <option value="title">Title</option>
                <option value="type">Type</option>
                <option value="provider">Provider</option>
                <option value="duration">Duration</option>
                <option value="watched">Status</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400"
                } rounded-l-xl`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400"
                } rounded-r-xl`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selection Mode Actions */}
          {isSelectionMode ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedItems.size} selected
              </span>
              <button
                onClick={handleBulkMarkWatched}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-all flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Watched
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedItems(new Set());
                }}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {filteredItems.length > 0 && (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all flex items-center gap-1"
                >
                  <Filter className="w-4 h-4" /> Select
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              : "space-y-3"
          }`}
        >
          {Array.from({ length: viewMode === "grid" ? 10 : 5 }).map((_, i) => (
            <SkeletonItem key={i} grid={viewMode === "grid"} />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
          {filteredItems.map((item) => (
<GridItem
               key={item.id}
               item={item}
               isSelected={selectedItems.has(item.id)}
               isSelectionMode={isSelectionMode}
               onToggleSelect={handleToggleSelectItem}
               onToggleWatched={handleToggleWatched}
               onRemove={handleRemove}
               onSaveNote={handleSaveNote}
               expandedNotes={expandedNotes}
               onToggleNotes={toggleNotes}
             />
          ))}
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {filteredItems.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              isSelected={selectedItems.has(item.id)}
              isSelectionMode={isSelectionMode}
              onToggleSelect={handleToggleSelectItem}
              onToggleWatched={handleToggleWatched}
              onRemove={handleRemove}
              onSaveNote={handleSaveNote}
              expandedNotes={expandedNotes}
              onToggleNotes={toggleNotes}
            />
          ))}
        </div>
      )}

    </div>
  );
}