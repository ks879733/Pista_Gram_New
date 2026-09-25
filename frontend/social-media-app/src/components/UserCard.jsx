import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, UserCheck, Clock, Loader2 } from "lucide-react";
import api from "../lib/api";

const UserCard = ({ user, onStatusChange }) => {
  const [status, setStatus] = useState(user.followStatus || "follow");
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);

    try {
      await api.post(`/user/${user._id}/follow`);

      // Public account -> following, private account -> requested.
      const newStatus = user.isPrivate ? "requested" : "following";
      setStatus(newStatus);

      if (onStatusChange) {
        onStatusChange(user._id, newStatus);
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);

    try {
      await api.post(`/user/${user._id}/unfollow`);
      setStatus("follow");

      if (onStatusChange) {
        onStatusChange(user._id, "follow");
      }
    } catch (error) {
      console.error("Unfollow error:", error);
    } finally {
      setLoading(false);
    }
  };

  const buttonContent = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === "following") return <><UserCheck className="h-4 w-4" /> Following</>;
    if (status === "requested") return <><Clock className="h-4 w-4" /> Requested</>;
    return <><UserPlus className="h-4 w-4" /> Follow</>;
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/profile/${user._id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 text-lg font-bold text-white">
            {(user.username || "U")[0].toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate font-bold text-slate-900">@{user.username}</p>
              {user.isVerified && <span className="text-blue-500">✓</span>}
            </div>
            <p className="truncate text-sm text-slate-500">
              {user.profileName || "PistaGram user"}
            </p>
            {user.bio && (
              <p className="mt-1 truncate text-xs text-slate-400">{user.bio}</p>
            )}
          </div>
        </div>
      </Link>

      {status === "following" ? (
        <button
          disabled={loading}
          onClick={handleUnfollow}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {buttonContent()}
        </button>
      ) : (
        <button
          disabled={loading || status === "requested"}
          onClick={handleFollow}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-pink-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-pink-600 disabled:bg-slate-200 disabled:text-slate-500"
        >
          {buttonContent()}
        </button>
      )}
    </div>
  );
};

export default UserCard;
