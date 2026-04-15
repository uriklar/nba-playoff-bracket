import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const AuthUI: React.FC = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPendingConfirmation, setIsPendingConfirmation] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsProcessing(true);
    setIsPendingConfirmation(false);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setAuthError(error.message);
    } else if (data.user && data.session === null) {
      setAuthMessage("Signup successful! Please check your email to confirm.");
      setIsPendingConfirmation(true);
    } else if (data.user && data.session !== null) {
      setAuthMessage("Signup successful and logged in!");
    } else {
      setAuthMessage(
        "Signup request processed. Check email if confirmation needed."
      );
    }
    setPassword("");
    setIsProcessing(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsProcessing(true);
    setIsPendingConfirmation(false);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage("Sign in successful!");
    }
    setPassword("");
    setIsProcessing(false);
  };

  const handleSignOut = async () => {
    setAuthError(null);
    setAuthMessage(null);
    setIsProcessing(true);
    setIsPendingConfirmation(false);

    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage("Signed out successfully.");
      setEmail("");
    }
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">Loading authentication status...</div>
    );
  }

  return (
    <div className="p-4 border rounded shadow max-w-md mx-auto">
      {user ? (
        <div>
          <p className="mb-2">
            Welcome, <span className="font-semibold">{user.email}</span>!
          </p>
          {authMessage && !isPendingConfirmation && (
            <p className="text-sm text-green-600 mb-2">{authMessage}</p>
          )}
          {authError && (
            <p className="text-sm text-red-600 mb-2">{authError}</p>
          )}
          <button
            onClick={handleSignOut}
            disabled={isProcessing}
            className="w-full btn btn-danger"
          >
            {isProcessing ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      ) : isPendingConfirmation ? (
        <div>
          <h2 className="text-xl font-semibold text-center mb-4">
            Check your Email
          </h2>
          {authMessage && (
            <p className="text-sm text-green-600 mb-2">{authMessage}</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-4">
          <h2 className="text-xl font-semibold text-center mb-4">
            Sign In or Sign Up
          </h2>
          {authMessage && (
            <p className="text-sm text-green-600 mb-2">{authMessage}</p>
          )}
          {authError && (
            <p className="text-sm text-red-600 mb-2">{authError}</p>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isProcessing}
              className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              disabled={isProcessing}
              className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              onClick={handleSignIn}
              disabled={isProcessing}
              className="flex-1 btn btn-primary"
            >
              {isProcessing ? "Processing..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isProcessing}
              className="flex-1 btn btn-secondary"
            >
              {isProcessing ? "Processing..." : "Sign Up"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AuthUI;
