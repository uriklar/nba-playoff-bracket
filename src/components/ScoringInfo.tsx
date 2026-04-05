import React, { useState } from "react";

const STORAGE_KEY = "scoring-info-dismissed";

const ScoringInfo: React.FC = () => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1"
  );

  const toggle = () => {
    const next = !dismissed;
    setDismissed(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, "1");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-custom border border-secondary/30 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-background/50 transition-colors"
      >
        <h2 className="text-base font-semibold text-primary font-montserrat">
          How Scoring Works
        </h2>
        <svg
          className={`w-5 h-5 text-primary/50 transition-transform duration-200 ${
            dismissed ? "" : "rotate-180"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {!dismissed && (
        <div className="px-4 pb-4">
          <p className="text-sm text-primary/60 font-inter mb-3">
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

          <div className="mt-3 pt-3 border-t border-secondary/20 flex items-baseline justify-between text-sm font-inter">
            <span className="text-primary/60">
              You must pick the correct winner to earn the series length bonus.
            </span>
            <span className="text-accent font-semibold whitespace-nowrap ml-4">
              280 pts max
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoringInfo;
