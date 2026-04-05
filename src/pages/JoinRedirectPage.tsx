import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getGroupByJoinCode } from "../utils/db";

const JoinRedirectPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) {
      setError(true);
      return;
    }

    getGroupByJoinCode(code.toUpperCase()).then((group) => {
      if (group) {
        navigate(`/g/${group.id}/submit`, { replace: true });
      } else {
        setError(true);
      }
    });
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-primary font-montserrat mb-2">
          Group Not Found
        </h1>
        <p className="text-primary/60 font-inter mb-6">
          The join code <span className="font-mono font-semibold">{code}</span>{" "}
          doesn't match any group. Check the code and try again.
        </p>
        <Link
          to="/"
          className="px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-accent hover:bg-accent/90 transition duration-200 font-inter"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <p className="text-primary/60 font-inter">Joining group...</p>
    </div>
  );
};

export default JoinRedirectPage;
