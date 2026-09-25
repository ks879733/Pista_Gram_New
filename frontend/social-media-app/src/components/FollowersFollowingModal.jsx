
import React, { useEffect, useState } from "react";
import { X, Loader2, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

const FollowersFollowingModal = ({ type, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const endpoint = type === "followers" ? "/user/followers" : "/user/following";
        const response = await api.get(endpoint);

        setUsers(response.data[type] || []);
      } catch (error) {
        setError(error.response?.data?.message || `Unable to load ${type}.`);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [type]);

  const openProfile = (userId) => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-xl font-black capitalize text-slate-900">{type}</h2>
            <p className="text-sm text-slate-400">Click a person to open their profile</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading {type}...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <UserCircle className="mx-auto mb-3 h-10 w-10" />
              No {type} yet.
            </div>
          )}

          {!loading && !error && users.map((user) => (
            <button
              key={user._id}
              onClick={() => openProfile(user._id)}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-50"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-500 via-orange-400 to-purple-500 font-bold text-white">
                {(user.username || "U")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="truncate font-bold text-slate-900">@{user.username}</p>
                  {user.isVerified && <span className="text-blue-500">✓</span>}
                </div>
                <p className="truncate text-sm text-slate-500">{user.profileName || "PistaGram user"}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">ID: {user._id}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowersFollowingModal;
