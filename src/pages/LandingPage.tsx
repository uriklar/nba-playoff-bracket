import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGroup, getGroupByJoinCode } from "../utils/db";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Create group state
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join group state
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    const group = await createGroup(groupName.trim());
    if (group) {
      navigate(`/g/${group.id}/submit`);
    } else {
      setCreateError("Failed to create group. Please try again.");
    }
    setIsCreating(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setJoinError(null);

    const group = await getGroupByJoinCode(joinCode.trim());
    if (group) {
      navigate(`/g/${group.id}`);
    } else {
      setJoinError("Group not found. Check your code and try again.");
    }
    setIsJoining(false);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <img
          src="/hb-ball.png"
          alt="NBA Bracket Challenge"
          className="h-20 w-20 object-contain mx-auto mb-4"
        />
        <h1 className="text-4xl md:text-5xl font-bold text-primary font-montserrat">
          NBA Playoff{" "}
          <span className="text-accent">Bracket Challenge</span>
        </h1>
        <p className="mt-3 text-lg text-primary/70 font-inter max-w-xl mx-auto">
          Create a group for your friends or coworkers, share the code, and
          compete to see who makes the best playoff predictions.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-2xl">
        {/* Create Group */}
        <div className="flex-1 bg-white rounded-xl shadow-custom p-6 border border-secondary/30">
          <h2 className="text-xl font-semibold text-primary mb-4 font-montserrat">
            Create a Group
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-primary/80 font-inter mb-1.5"
              >
                Group Name
              </label>
              <input
                id="groupName"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Engineering Team"
                required
                disabled={isCreating}
                className="w-full px-4 py-2.5 rounded-lg border border-secondary/50
                         focus:ring-2 focus:ring-accent/30 focus:border-accent
                         disabled:bg-background/50 disabled:cursor-not-allowed
                         placeholder:text-primary/40 font-inter text-primary
                         transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating || !groupName.trim()}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg text-white
                       bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2
                       focus:ring-offset-2 focus:ring-accent disabled:opacity-50
                       disabled:cursor-not-allowed transition duration-200 font-inter"
            >
              {isCreating ? "Creating..." : "Create Group"}
            </button>
            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}
          </form>
        </div>

        {/* Join Group */}
        <div className="flex-1 bg-white rounded-xl shadow-custom p-6 border border-secondary/30">
          <h2 className="text-xl font-semibold text-primary mb-4 font-montserrat">
            Join a Group
          </h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label
                htmlFor="joinCode"
                className="block text-sm font-medium text-primary/80 font-inter mb-1.5"
              >
                Join Code
              </label>
              <input
                id="joinCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123"
                required
                disabled={isJoining}
                maxLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-secondary/50
                         focus:ring-2 focus:ring-accent/30 focus:border-accent
                         disabled:bg-background/50 disabled:cursor-not-allowed
                         placeholder:text-primary/40 font-inter text-primary
                         tracking-widest text-center text-lg uppercase
                         transition duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isJoining || !joinCode.trim()}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg text-white
                       bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2
                       focus:ring-offset-2 focus:ring-accent disabled:opacity-50
                       disabled:cursor-not-allowed transition duration-200 font-inter"
            >
              {isJoining ? "Joining..." : "Join Group"}
            </button>
            {joinError && (
              <p className="text-sm text-red-600">{joinError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
