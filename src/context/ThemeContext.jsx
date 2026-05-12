import { createContext, useContext, useEffect, useMemo } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const value = useMemo(() => ({ theme: "dark" }), []);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};