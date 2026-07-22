import { useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";

const FEATURES = [
  {
    icon: <PlayCircle className="w-5 h-5" />,
    title: "Search Anything",
    description: "Find movies, TV shows, and YouTube videos from a massive database",
  },
  {
    icon: <PlayCircle className="w-5 h-5" />,
    title: "Organize Easily",
    description: "Sort, filter, and manage your watchlist with powerful tools",
  },
  {
    icon: <PlayCircle className="w-5 h-5" />,
    title: "Stay Updated",
    description: "Track what you've watched and what's still on your list",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [particles] = useState(() =>
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 5,
      delay: Math.random() * 5,
    }))
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate("/", { replace: true });
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-indigo-500/10 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-950 to-purple-900/20" />
        <div className="absolute -top-1/2 -right-1/2 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl dark:bg-gray-900/50 rounded-3xl border border-white/10 dark:border-gray-800/50 shadow-2xl shadow-black/20 overflow-hidden">
          {/* Card Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-6">
              <PlayCircle className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
              Stream Watchlist
            </h1>
            <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
              Your personal streaming companion. Track, organize, and never miss what to watch next.
            </p>
          </div>

          {/* Card Body */}
          <div className="px-8 pb-8 space-y-4">
            {/* Features */}
            <div className="space-y-3 mb-6">
              {FEATURES.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] transition-all hover:bg-white/[0.06]"
                >
                  <div className="mt-0.5 flex-shrink-0 text-indigo-400">
                    {feature.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{feature.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sign in button */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-4 bg-white text-gray-900 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 hover:bg-gray-50"
            >
              <PlayCircle className="w-5 h-5" />
              Continue with Google
            </button>

            <p className="text-center text-[11px] text-gray-500 pt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <span className="text-xs text-gray-600 dark:text-gray-500">
            Made with ❤️ for movie lovers
          </span>
        </div>
      </div>
    </div>
  );
}