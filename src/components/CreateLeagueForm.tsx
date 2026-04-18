import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

const CreateLeagueForm: React.FC = () => {
  const { user } = useAuth();
  const [leagueName, setLeagueName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a league.");
      return;
    }
    if (!leagueName.trim()) {
      setError("League name cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error: insertError } = await supabase
        .from("leagues")
        .insert([{ name: leagueName.trim(), owner_id: user.id }])
        .select() // Optionally select the newly created league data
        .single(); // Expecting a single row back

      if (insertError) {
        // RLS errors or other DB errors will be caught here
        throw insertError;
      }

      // Handle success
      setSuccessMessage(`League "${data.name}" created successfully!`);
      console.log("Created league:", data);
      setLeagueName(""); // Clear the form
      // TODO: Optionally redirect or update a list of leagues
    } catch (err: unknown) {
      console.error("Error creating league:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Only render the form if the user is logged in
  if (!user) {
    return null; // Or show a message like "Log in to create a league"
  }

  return (
    <div className="mt-6 p-4 border rounded shadow max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create New League</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && (
          <p className="text-sm text-green-600 mb-2">{successMessage}</p>
        )}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div>
          <label
            htmlFor="leagueName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            League Name
          </label>
          <input
            id="leagueName"
            type="text"
            required
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            placeholder="My Awesome League"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary" // Using primary button style
        >
          {isLoading ? "Creating..." : "Create League"}
        </button>
      </form>
    </div>
  );
};

export default CreateLeagueForm;
