const providerIcons = {
  "Netflix": "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-381-tmdb-logo-white-4db6bfc35ab6a339dd667a8ef0523499.svg",
  "Disney+": "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-381-tmdb-logo-white-4db6bfc35ab6a339dd667a8ef0523499.svg",
  "Hulu": "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-381-tmdb-logo-white-4db6bfc35ab6a339dd667a8ef0523499.svg",
  "Amazon Prime Video": "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-381-tmdb-logo-white-4db6bfc35ab6a339dd667a8ef0523499.svg",
  "HBO Max": "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-381-tmdb-logo-white-4db6bfc35ab6a339dd667a8ef0523499.svg",
  "YouTube": "https://www.youtube.com/s/desktop/8e5e1b2c/img/favicon_144x144.png",
};

export const getProviderIcon = (provider) => {
  return providerIcons[provider] || null;
};