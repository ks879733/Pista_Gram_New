import React from "react";
import { Check, X, Bell, Loader2, User } from "lucide-react";
import MainLayout from "../components/MainLayout";
import api from "../lib/api";

const Notifications = () => {
  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(null);
  const [error, setError] = React.useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/user/follow-requests");

      setRequests(response.data.requests || []);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadNotifications();
  }, []);

  const handleAccept = async (requesterId) => {
    try {
      setActionLoading(requesterId);
      setError("");

      await api.post(`/user/accepted-request/${requesterId}`);

      setRequests((prev) =>
        prev.filter((request) => request._id !== requesterId)
      );
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to accept follow request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requesterId) => {
    try {
      setActionLoading(requesterId);
      setError("");

      await api.post(`/user/rejected-request/${requesterId}`);

      setRequests((prev) =>
        prev.filter((request) => request._id !== requesterId)
      );
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to reject follow request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-500">
            <Bell className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Notifications
            </h1>

            <p className="text-sm text-slate-500">
              Manage your follow requests
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-pink-500" />

            <p className="mt-3 text-sm text-slate-500">
              Loading notifications...
            </p>
          </div>
        ) : requests.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm sm:p-14">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100">
              <Bell className="h-7 w-7 text-slate-400" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              No notifications
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              You don't have any pending follow requests.
            </p>
          </div>
        ) : (
          /* Notification List */
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {requests.map((request, index) => (
              <div
                key={request._id}
                className={`flex items-center gap-3 p-4 sm:gap-4 sm:p-5 ${
                  index !== requests.length - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                {/* User Icon */}
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-500 via-orange-400 to-purple-500 text-lg font-black text-white">
                  {(request.username || "U")[0].toUpperCase()}
                </div>

                {/* User Information */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-bold text-slate-800">
                      {request.profileName || request.username}
                    </p>

                    {request.isVerified && (
                      <span className="text-sm font-bold text-blue-500">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="truncate text-sm text-slate-500">
                    @{request.username}
                  </p>

                  <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                    Sent you a follow request
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleAccept(request._id)}
                    disabled={actionLoading === request._id}
                    aria-label={`Accept ${request.username}`}
                    title="Accept"
                    className="grid h-10 w-10 place-items-center rounded-full bg-green-50 text-green-600 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === request._id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    )}
                  </button>

                  <button
                    onClick={() => handleReject(request._id)}
                    disabled={actionLoading === request._id}
                    aria-label={`Reject ${request.username}`}
                    title="Reject"
                    className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Notifications;