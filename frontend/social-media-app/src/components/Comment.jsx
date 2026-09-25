import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CornerDownRight, Send } from "lucide-react";
import api from "../lib/api";

const Comment = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  const [replyText, setReplyText] = useState({});
  const [openReplies, setOpenReplies] = useState({});

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyLoading, setReplyLoading] = useState("");

  const [error, setError] = useState("");

  // --------------------------------
  // LOAD COMMENTS
  // --------------------------------
  const loadComments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/posts/${postId}/comments`);

      setComments(response.data.comments || []);
    } catch (err) {
      console.error("Load comments error:", err);

      setError(err.response?.data?.message || "Unable to load comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  // --------------------------------
  // ADD COMMENT
  // --------------------------------
  const addComment = async (event) => {
    event.preventDefault();

    const value = text.trim();

    if (!value) {
      setError("Please enter comments");
      return;
    }

    try {
      setSending(true);
      setError("");

      console.log("COMMENT VALUE:", value);
      console.log("COMMENT VALUE TYPE:", typeof value);
      await api.post(`/posts/${postId}/comments`, {
        text: value,
      });

      // Clear input
      setText("");

      // Load fresh comments from database
      await loadComments();
    } catch (err) {
      console.error("Add comment error:", err);

      setError(err.response?.data?.message || "Unable to add comment.");
    } finally {
      setSending(false);
    }
  };

  // --------------------------------
  // ADD REPLY
  // --------------------------------
  const addReply = async (commentId) => {
    const value = replyText[commentId]?.trim();

    if (!value) {
      return;
    }

    try {
      setReplyLoading(commentId);
      setError("");

      /*
        Backend reply API expects:

        {
          text: "reply"
        }
      */

      await api.post(`/posts/${postId}/comments/${commentId}/replies`, {
        text: value,
      });

      // Clear reply input
      setReplyText((old) => ({
        ...old,
        [commentId]: "",
      }));

      // Keep replies open
      setOpenReplies((old) => ({
        ...old,
        [commentId]: true,
      }));

      // Reload comments
      await loadComments();
    } catch (err) {
      console.error("Add reply error:", err);

      setError(err.response?.data?.message || "Unable to add reply.");
    } finally {
      setReplyLoading("");
    }
  };

  // --------------------------------
  // OPEN / CLOSE REPLIES
  // --------------------------------
  const toggleReplies = (commentId) => {
    setOpenReplies((old) => ({
      ...old,
      [commentId]: !old[commentId],
    }));
  };

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      {/* =========================
          ADD COMMENT FORM
      ========================== */}

      <form onSubmit={addComment} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a comment..."
          maxLength={500}
          className="min-w-0 flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pink-200"
        />

        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-xl bg-pink-500 px-4 text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="Add comment"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      {/* =========================
          ERROR
      ========================== */}

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* =========================
          COMMENTS LIST
      ========================== */}

      <div className="mt-4 space-y-3">
        {/* LOADING */}

        {loading ? (
          <p className="text-sm text-slate-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          /* EMPTY */

          <p className="text-sm text-slate-400">
            No comments yet. Be the first!
          </p>
        ) : (
          /* COMMENTS */

          comments.map((comment) => {
            const replies = comment.replies || [];

            const repliesOpen = openReplies[comment._id];

            return (
              <div key={comment._id} className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-start gap-3">
                  {/* USER AVATAR */}

                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-sm font-bold text-white">
                    {(comment.user?.username || "U")[0].toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* USERNAME */}

                    <p className="text-sm font-bold text-slate-900">
                      @{comment.user?.username || "user"}
                    </p>

                    {/* COMMENT */}

                    <p className="mt-1 text-sm text-slate-600">
                      {comment.text}
                    </p>

                    {/* REPLY BUTTON */}

                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleReplies(comment._id)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-pink-500"
                      >
                        {repliesOpen ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}

                        {replies.length}

                        {replies.length === 1 ? " reply" : " replies"}
                      </button>
                    </div>

                    {/* REPLIES */}

                    {repliesOpen && (
                      <div className="mt-3 border-l-2 border-pink-100 pl-3">
                        {/* EXISTING REPLIES */}

                        <div className="space-y-2">
                          {replies.map((reply) => (
                            <div
                              key={reply._id}
                              className="rounded-xl bg-white p-2.5"
                            >
                              <p className="text-xs font-bold text-slate-900">
                                @{reply.user?.username || "user"}
                              </p>

                              <p className="mt-1 text-xs text-slate-600">
                                {reply.text}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* ADD REPLY */}

                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={replyText[comment._id] || ""}
                            onChange={(event) =>
                              setReplyText((old) => ({
                                ...old,
                                [comment._id]: event.target.value,
                              }))
                            }
                            placeholder="Write a reply..."
                            maxLength={500}
                            className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-xs outline-none ring-1 ring-slate-200 focus:ring-pink-200"
                          />

                          <button
                            type="button"
                            disabled={
                              replyLoading === comment._id ||
                              !replyText[comment._id]?.trim()
                            }
                            onClick={() => addReply(comment._id)}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                            title="Add reply"
                          >
                            <CornerDownRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Comment;
