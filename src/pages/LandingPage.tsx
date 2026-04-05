import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGroup, getGroupByJoinCode, type Group } from "../utils/db";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Create group state
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);

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
      setCreatedGroup(group);
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
      navigate(`/g/${group.id}/submit`);
    } else {
      setJoinError("Group not found. Check your code and try again.");
    }
    setIsJoining(false);
  };

  const inviteLink = createdGroup
    ? `${window.location.origin}/join/${createdGroup.join_code}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = inviteLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Post-creation interstitial
  if (createdGroup) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-custom p-8 border border-secondary/30 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary font-montserrat">
              {createdGroup.name}
            </h2>
            <p className="text-primary/60 font-inter mt-1">
              Group created! Share the code so others can join.
            </p>
          </div>

          {/* Join Code */}
          <div className="bg-background rounded-lg p-4 mb-4">
            <p className="text-xs text-primary/50 font-inter uppercase tracking-wider mb-1">
              Join Code
            </p>
            <p className="text-4xl font-mono font-bold tracking-[0.3em] text-primary">
              {createdGroup.join_code}
            </p>
          </div>

          {/* Copy Invite Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg
                     border border-secondary/50 text-primary/80 hover:bg-background
                     transition duration-200 font-inter mb-6"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {copied ? "Copied!" : "Copy Invite Link"}
          </button>

          {/* Continue CTA */}
          <button
            onClick={() => navigate(`/g/${createdGroup.id}/submit`)}
            className="w-full px-4 py-3 text-sm font-medium rounded-lg text-white
                     bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-accent transition duration-200 font-inter"
          >
            Continue to Fill Your Bracket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-12">
        <img
          src="/basketball.svg"
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

      {/* How Scoring Works */}
      <div className="w-full max-w-2xl mt-12">
        <div className="bg-white rounded-xl shadow-custom p-6 border border-secondary/30">
          <h2 className="text-xl font-semibold text-primary mb-2 font-montserrat">
            How Scoring Works
          </h2>
          <p className="text-sm text-primary/60 font-inter mb-4">
            Points increase each round. Nail the series length for bonus points.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-inter">
              <thead>
                <tr className="border-b border-secondary/30">
                  <th className="text-left py-2 pr-4 text-primary/70 font-medium">
                    Round
                  </th>
                  <th className="text-center py-2 px-2 text-primary/70 font-medium">
                    Winner
                  </th>
                  <th className="text-center py-2 px-2 text-primary/70 font-medium">
                    Series Length
                  </th>
                  <th className="text-center py-2 pl-2 text-primary/70 font-medium">
                    Max / Series
                  </th>
                </tr>
              </thead>
              <tbody className="text-primary">
                <tr className="border-b border-secondary/20">
                  <td className="py-2 pr-4">First Round</td>
                  <td className="py-2 px-2 text-center">8</td>
                  <td className="py-2 px-2 text-center">+6</td>
                  <td className="py-2 pl-2 text-center font-semibold">14</td>
                </tr>
                <tr className="border-b border-secondary/20">
                  <td className="py-2 pr-4">Conf. Semifinals</td>
                  <td className="py-2 px-2 text-center">12</td>
                  <td className="py-2 px-2 text-center">+8</td>
                  <td className="py-2 pl-2 text-center font-semibold">20</td>
                </tr>
                <tr className="border-b border-secondary/20">
                  <td className="py-2 pr-4">Conf. Finals</td>
                  <td className="py-2 px-2 text-center">16</td>
                  <td className="py-2 px-2 text-center">+10</td>
                  <td className="py-2 pl-2 text-center font-semibold">26</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">NBA Finals</td>
                  <td className="py-2 px-2 text-center">24</td>
                  <td className="py-2 px-2 text-center">+12</td>
                  <td className="py-2 pl-2 text-center font-semibold">36</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-secondary/20 flex items-baseline justify-between text-sm font-inter">
            <span className="text-primary/60">
              You must pick the correct winner to earn the series length bonus.
            </span>
            <span className="text-accent font-semibold whitespace-nowrap ml-4">
              280 pts max
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
