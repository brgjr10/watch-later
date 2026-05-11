import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Watchlist from "./pages/Watchlist";
import Search from "./pages/Search";

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={user ? <Watchlist /> : <Navigate to="/login" />}
        />
        <Route
          path="/search"
          element={user ? <Search /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
}

export default App;