import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

const Login = () => {
  const { setUser, setToken, navigate } = useAppContext();
  const [state, setState] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = state === "login" ? "/api/auth/login" : "/api/auth/register";
    const bodyData = state === "login" ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Success animation before redirect
        const form = document.querySelector('.auth-form');
        if (form) {
          form.style.transform = 'scale(0.95)';
          form.style.opacity = '0.8';
          setTimeout(() => {
            navigate("/");
          }, 300);
        }
      } else {
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error, please try again");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    // Animation for mode switch
    const form = document.querySelector('.auth-form');
    if (form) {
      form.style.transform = 'scale(0.98)';
      form.style.opacity = '0.9';
      setTimeout(() => {
        setState(state === "login" ? "register" : "login");
        setError("");
        setName("");
        setEmail("");
        setPassword("");
        form.style.transform = 'scale(1)';
        form.style.opacity = '1';
      }, 200);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="auth-form relative z-10 w-full max-w-md transform transition-all duration-500">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center border-b border-white/10">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center shadow-2xl animate-pulse">
              <img src={assets.logo} alt="Logo" className="w-10 h-10 invert" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {state === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-white/70">
              {state === "login" ? "Sign in to continue your journey" : "Join us to start creating"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {state === "register" && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-white/80 text-sm font-medium">Full Name</label>
                <input 
                  onChange={(e) => setName(e.target.value)} 
                  value={name} 
                  placeholder="Enter your full name" 
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/40 transition-all duration-300 backdrop-blur-sm"
                  type="text" 
                  required 
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">Email Address</label>
              <input 
                onChange={(e) => setEmail(e.target.value)} 
                value={email} 
                placeholder="Enter your email" 
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/40 transition-all duration-300 backdrop-blur-sm"
                type="email" 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">Password</label>
              <input 
                onChange={(e) => setPassword(e.target.value)} 
                value={password} 
                placeholder="Enter your password" 
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/40 transition-all duration-300 backdrop-blur-sm"
                type="password" 
                required 
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm animate-shake">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            <button 
              type='submit' 
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                loading 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {state === "register" ? "Creating Account..." : "Signing In..."}
                </div>
              ) : (
                state === "register" ? "Create Account" : "Sign In"
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={switchMode}
                className="text-white/70 hover:text-white transition-colors duration-300 text-sm hover:scale-105 transform transition-transform"
              >
                {state === "register" 
                  ? "Already have an account? Sign In" 
                  : "Don't have an account? Create One"
                }
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="p-6 border-t border-white/10 text-center">
            <p className="text-white/50 text-xs">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;