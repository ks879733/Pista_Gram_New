import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Settings, Users, UserPlus, UserCheck, Loader2 } from "lucide-react";
import MainLayout from "../components/MainLayout";
import PostCard from "../components/PostCard";
import FollowersFollowingModal from "../components/FollowersFollowingModal";
import api from "../lib/api";

const Profile = () => {
  const { userId } = useParams();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followStatus, setFollowStatus] = useState("follow");
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState("");
  const [listType, setListType] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const meResponse = await api.get("/user");
      const currentUser = meResponse.data;
      setMe(currentUser);

      const isOwnProfile = !userId || userId === currentUser._id.toString();

      if (isOwnProfile) {
        setProfile(currentUser);
        setFollowStatus("self");

        const postResponse = await api.get("/posts/myposts?page=1&limit=10");
        setPosts(postResponse.data.posts || []);
      } else {
        const response = await api.get(`/user/user/${userId}`);
        setProfile(response.data.user);
        setFollowStatus(response.data.followStatus || "follow");

        // The current backend only exposes /posts/myposts for the logged-in user.
        // Therefore another user's posts are not requested or faked here.
        setPosts([]);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Unable to load profile.");
      setProfile(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);

    try {
      const response = await api.post(`/user/${profile._id}/follow`);
      setFollowStatus(profile.isPrivate ? "requested" : "following");

      // Reload so follower/following counts come from the database.
      await loadProfile();
      setError(response.data?.message || "");
    } catch (error) {
      setError(error.response?.data?.message || "Unable to follow user.");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    setFollowLoading(true);

    try {
      await api.post(`/user/${profile._id}/unfollow`);
      setFollowStatus("follow");
      await loadProfile();
    } catch (error) {
      setError(error.response?.data?.message || "Unable to unfollow user.");
    } finally {
      setFollowLoading(false);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      setPosts((oldPosts) => oldPosts.filter((post) => post._id !== postId));
    } catch (error) {
      setError(error.response?.data?.message || "Unable to delete post.");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-4xl p-8 text-center text-slate-400">Loading profile...</div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
            <Users className="mx-auto h-10 w-10 text-amber-500" />
            <h1 className="mt-4 text-2xl font-black">Profile not available</h1>
            <p className="mt-2 text-slate-600">{error}</p>
            <Link to="/home" className="mt-5 inline-block rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">Back to Home</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isOwnProfile = profile._id === me?._id;

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-500 via-orange-400 to-purple-500 text-4xl font-black text-white">
              {(profile.username || "U")[0].toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black">@{profile.username}</h1>
                {profile.isVerified && <span className="rounded-full bg-blue-50 px-2 py-1 text-sm font-bold text-blue-500">✓ Verified</span>}

                {isOwnProfile ? (
                  <button disabled className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400">
                    <Settings className="mr-2 inline h-4 w-4" /> Edit
                  </button>
                ) : followStatus === "following" ? (
                  <button onClick={handleUnfollow} disabled={followLoading} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                    {followLoading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : <><UserCheck className="mr-2 inline h-4 w-4" />Following</>}
                  </button>
                ) : (
                  <button onClick={handleFollow} disabled={followLoading || followStatus === "requested"} className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500">
                    {followLoading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : followStatus === "requested" ? "Requested" : <><UserPlus className="mr-2 inline h-4 w-4" />Follow</>}
                  </button>
                )}
              </div>

              <p className="mt-2 text-slate-500">{profile.profileName || "PistaGram user"}</p>
              <p className="mt-3 max-w-xl text-slate-600">{profile.bio || "No bio yet."}</p>
              <p className="mt-2 break-all text-xs text-slate-400">User ID: {profile._id}</p>

              <div className="mt-5 flex flex-wrap gap-3 text-sm">
                <span className="rounded-xl bg-slate-50 px-4 py-2"><b>{isOwnProfile ? posts.length : "—"}</b> posts</span>
                <button onClick={() => setListType("followers")} className="rounded-xl bg-slate-50 px-4 py-2 hover:bg-slate-100">
                  <b>{profile.followers?.length || 0}</b> followers
                </button>
                <button onClick={() => setListType("following")} className="rounded-xl bg-slate-50 px-4 py-2 hover:bg-slate-100">
                  <b>{profile.following?.length || 0}</b> following
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        {isOwnProfile && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">My Posts</h2>
              <Link to="/create-post" className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600">Create Post</Link>
            </div>

            <div className="space-y-6">
              {posts.map((post) => <PostCard key={post._id} post={post} currentUser={me} onDelete={deletePost} />)}
              {!posts.length && <div className="rounded-3xl bg-white p-10 text-center text-slate-400">You have not created a post yet.</div>}
            </div>
          </div>
        )}

        {!isOwnProfile && (
          <div className="mt-6 rounded-3xl bg-white p-8 text-center text-slate-400">
            This user's profile is available. Their posts are not shown because the current backend does not expose another-user post endpoint.
          </div>
        )}
      </div>

      {listType && (
        <FollowersFollowingModal type={listType} onClose={() => setListType(null)} />
      )}
    </MainLayout>
  );
};

export default Profile;
