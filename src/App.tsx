import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useOutletContext, Outlet } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import JoinRedirectPage from "./pages/JoinRedirectPage";
import ScoreboardPage from "./components/ScoreboardPage";
import BracketSubmissionPage from "./components/BracketSubmissionPage";
import ViewBracketPage from "./pages/ViewBracketPage";
import PaymentBanner from "./components/PaymentBanner";
import { getGroupById, type Group } from "./utils/db";
import { getAdminSecret, getParticipantName } from "./utils/localStorage";
import { getPaymentStatus } from "./utils/db";

export interface GroupContext {
  group: Group | null;
  isAdmin: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGroupContext() {
  return useOutletContext<GroupContext>();
}

function GroupNav({ groupName }: { groupName: string | null }) {
  const { groupId } = useParams();
  return (
    <nav className="bg-[#ffd866] shadow-lg">
      <div className="container mx-auto flex justify-between items-center py-4 px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center">
            <img
              src="/basketball.svg"
              alt="NBA Bracket Challenge Logo"
              className="h-12 w-12 object-contain"
            />
          </Link>
          {groupName && (
            <span className="text-[#1a1a1d] font-bold text-lg font-montserrat">
              {groupName}
            </span>
          )}
        </div>
        <div className="space-x-4">
          <Link
            to={`/g/${groupId}`}
            className="text-[#1a1a1d] hover:text-[#5a2ee5] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Scoreboard
          </Link>
          <Link
            to={`/g/${groupId}/submit`}
            className="text-[#1a1a1d] hover:text-[#5a2ee5] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            Submit Bracket
          </Link>
          <Link
            to={`/g/${groupId}/view-bracket`}
            className="text-[#1a1a1d] hover:text-[#5a2ee5] px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            View Brackets
          </Link>
        </div>
      </div>
    </nav>
  );
}

function GroupLayout() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  const isAdmin = !!(groupId && getAdminSecret(groupId));

  useEffect(() => {
    if (!groupId) return;

    getGroupById(groupId).then(setGroup);

    const participantName = getParticipantName(groupId);
    if (participantName) {
      getPaymentStatus(groupId, participantName).then(setIsPaid);
    }
  }, [groupId]);

  return (
    <>
      <GroupNav groupName={group?.name ?? null} />
      <PaymentBanner
        paymentInstructions={group?.payment_instructions ?? null}
        isPaid={isPaid}
        isAdmin={isAdmin}
      />
      <main className="mx-auto px-4 py-6">
        <Outlet context={{ group, isAdmin } satisfies GroupContext} />
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f8f5fd]">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/join/:code" element={<JoinRedirectPage />} />
          <Route path="/g/:groupId" element={<GroupLayout />}>
            <Route index element={<ScoreboardPage />} />
            <Route path="submit" element={<BracketSubmissionPage />} />
            <Route path="view-bracket" element={<ViewBracketPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
