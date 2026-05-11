const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const BASE_URL = "https://api.themoviedb.org/3";

export const searchTitles = async (query) => {
  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  if (!res.ok) throw new Error("TMDB search failed");
  return res.json();
};

export const getWatchProviders = async (type, id) => {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}/watch/providers?api_key=${API_KEY}`
  );
  if (!res.ok) throw new Error("Watch providers fetch failed");
  return res.json();
};

export const getMediaDetails = async (type, id) => {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}?api_key=${API_KEY}&append_to_response=external_ids`
  );
  if (!res.ok) throw new Error("Failed to fetch media details");
  return res.json();
};

export const getImageUrl = (path) => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
};

export const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};
