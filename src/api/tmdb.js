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

export const getImageUrl = (path) => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
};