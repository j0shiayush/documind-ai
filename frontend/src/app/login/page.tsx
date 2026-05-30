"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function LoginPage() {
  // Mode toggles
  const [authMode, setAuthMode] = useState<"email" | "phone">("email");
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  
  // Status states
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // ── Google Auth ────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to initialize Google login.");
      setLoading(false);
    }
  };

  // ── Email Auth ─────────────────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Success! Please check your email for a confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  // ── Phone Auth ─────────────────────────────────────────────────────────
  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!otpSent) {
        // Step 1: Send the OTP
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        setOtpSent(true);
        setMessage("OTP sent! Please check your phone.");
      } else {
        // Step 2: Verify the OTP
        const { error } = await supabase.auth.verifyOtp({
          phone,
          token: otp,
          type: "sms",
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Phone authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0F19] p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-xl 
                      border border-gray-100 dark:border-gray-800 p-8 transition-colors">
        
        {/* Header & Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 relative mb-4">
            <Image 
              src="/logo.png" 
              alt="DocuMind AI Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Welcome to DocuMind AI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Log in or create an account to start analyzing documents.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 text-center animate-in fade-in zoom-in-95 duration-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-600 dark:text-green-400 text-center animate-in fade-in zoom-in-95 duration-200">
            {message}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 
                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 
                     text-gray-700 dark:text-gray-200 font-medium rounded-xl 
                     hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200 dark:border-gray-800"></div>
          <span className="px-4 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Or continue with</span>
          <div className="flex-1 border-t border-gray-200 dark:border-gray-800"></div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex p-1 mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
          <button
            onClick={() => { setAuthMode("email"); setError(null); setMessage(null); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
              authMode === "email" 
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => { setAuthMode("phone"); setError(null); setMessage(null); }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
              authMode === "phone" 
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Phone
          </button>
        </div>

        {/* Email Form */}
        {authMode === "email" && (
          <form onSubmit={handleEmailAuth} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        )}

        {/* Phone Form */}
        {authMode === "phone" && (
          <form onSubmit={handlePhoneAuth} className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Phone Number (with Country Code)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
                placeholder="+1 234 567 8900"
              />
            </div>
            
            {otpSent && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all tracking-widest text-center text-lg"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                otpSent ? "Verify & Login" : "Send OTP code"
              )}
            </button>
            
            {otpSent && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); setError(null); setMessage(null); }}
                  className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Edit phone number
                </button>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  );
}