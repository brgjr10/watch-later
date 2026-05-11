import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-8">Stream Watchlist</h1>
        <button
          onClick={handleGoogleSignIn}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}