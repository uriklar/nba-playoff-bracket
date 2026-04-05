import { BrowserRouter as Router, Routes, Route, Link, useParams } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ScoreboardPage from "./components/ScoreboardPage";
import BracketSubmissionPage from "./components/BracketSubmissionPage";
import ViewBracketPage from "./pages/ViewBracketPage";

function GroupNav() {
  const { groupId } = useParams();
  return (
    <nav className="bg-[#ffd866] shadow-lg">
      <div className="container mx-auto flex justify-between items-center py-4 px-4">
        <Link to="/" className="flex items-center">
          <img
            src="/hb-ball.png"
            alt="NBA Bracket Challenge Logo"
            className="h-12 w-12 object-contain"
          />
        </Link>
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
  return (
    <>
      <GroupNav />
      <main className="mx-auto px-4 py-6">
        <Routes>
          <Route index element={<ScoreboardPage />} />
          <Route path="submit" element={<BracketSubmissionPage />} />
          <Route path="view-bracket" element={<ViewBracketPage />} />
        </Routes>
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
          <Route path="/g/:groupId/*" element={<GroupLayout />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
