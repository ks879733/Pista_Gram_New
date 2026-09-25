import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, RefreshCw } from "lucide-react";
import MainLayout from "../components/MainLayout";
import PostCard from "../components/PostCard";
import api from "../lib/api";

const Home = () => {
  const [me, setMe] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHome = async () => {
    setLoading(true);
    setError("");

    try {
      const [meRes, followingRes, myPostsRes] = await Promise.all([
        api.get("/user"),
        api.get("/posts/following?page=1&limit=10"),
        api.get("/posts/myposts?page=1&limit=10"),
      ]);

      const followingPosts = followingRes.data.posts || [];
      const myPosts = myPostsRes.data.posts || [];

      // The backend has separate endpoints for following posts and my posts.
      // Merge them here so the home feed also shows the user's own posts.
      const allPosts = [...followingPosts, ...myPosts];
      const uniquePosts = Array.from(
        new Map(allPosts.map((post) => [post._id, post])).values()
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setMe(meRes.data);
      setPosts(uniquePosts);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, []);

  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      setPosts(posts.filter((post) => post._id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-pink-500">Welcome back</p>
              <h1 className="text-3xl font-black tracking-tight">{me?.profileName || me?.username || "PistaGram"}</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={loadHome} className="rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50">
                <RefreshCw className="h-5 w-5" />
              </button>
              <Link to="/create-post" className="rounded-xl bg-pink-500 px-4 py-3 font-semibold text-white hover:bg-pink-600">
                <Plus className="mr-1 inline h-5 w-5" /> Post
              </Link>
            </div>
          </div>

          {loading && <div className="rounded-3xl bg-white p-8 text-center text-slate-400">Loading your feed...</div>}
          {error && <div className="rounded-2xl bg-red-50 p-4 text-red-600">{error}</div>}

          {!loading && !error && posts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Users className="mx-auto h-10 w-10 text-pink-400" />
              <h2 className="mt-4 text-xl font-bold">Your feed is quiet</h2>
              <p className="mx-auto mt-2 max-w-md text-slate-500">Follow some people from Explore to see their posts here.</p>
              <Link to="/explore" className="mt-5 inline-block rounded-xl bg-pink-500 px-5 py-3 font-semibold text-white">Explore people</Link>
            </div>
          )}

          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} currentUser={me} onDelete={deletePost} />
            ))}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-xl font-bold text-white">
                  {(me?.username || "U")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">@{me?.username || "user"}</p>
                  <p className="text-sm text-slate-400">{me?.bio || "Share your moments."}</p>
                </div>
              </div>
              <Link to="/profile" className="mt-4 block text-center text-sm font-semibold text-pink-600">View profile</Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold">Your circle</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="text-2xl font-black text-pink-600">{me?.followers?.length || 0}</p>
                  <p className="text-xs text-slate-500">Followers</p>
                </div>
                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-2xl font-black text-orange-600">{me?.following?.length || 0}</p>
                  <p className="text-xs text-slate-500">Following</p>
                </div>
              </div>
              <Link to="/explore" className="mt-4 block text-center text-sm font-semibold text-pink-600">
                Open Discover
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </MainLayout>
  );
};

export default Home;
