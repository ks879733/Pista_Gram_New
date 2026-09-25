import React, { useEffect, useState } from "react";
import { Compass, Search, Users, UserPlus, Loader2 } from "lucide-react";
import MainLayout from "../components/MainLayout";
import UserCard from "../components/UserCard";
import PostCard from "../components/PostCard";
import api from "../lib/api";

const Explore = () => {
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");

  // Load every registered user from the existing backend /user/users API.
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError("");

      const response = await api.get("/user/users");
      const allUsers = Array.isArray(response.data) ? response.data : [];

      // Do not show the currently logged-in user in suggestions.
      const otherUsers = allUsers.filter(
        (user) => user._id !== me?._id
      );

      setUsers(otherUsers);
    } catch (error) {
      console.error("Users load error:", error);
      setError(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadExplore = async () => {
    try {
      setLoadingPosts(true);

      const [meResponse, postsResponse] = await Promise.all([
        api.get("/user"),
        api.get("/posts/following?page=1&limit=10"),
      ]);

      setMe(meResponse.data);
      setPosts(postsResponse.data.posts || []);

      // Load users after we know the current user.
      const usersResponse = await api.get("/user/users");
      const allUsers = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : [];

      setUsers(
        allUsers.filter((user) => user._id !== meResponse.data._id)
      );
    } catch (error) {
      console.error("Explore load error:", error);
      setError(error.response?.data?.message || "Unable to load explore data");
    } finally {
      setLoadingUsers(false);
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadExplore();
  }, []);

  const handleStatusChange = (userId, newStatus) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user._id === userId
          ? { ...user, followStatus: newStatus }
          : user
      )
    );
  };

  const filteredUsers = users.filter((user) => {
    const value = search.trim().toLowerCase();

    if (!value) return true;

    return (
      user.username?.toLowerCase().includes(value) ||
      user.profileName?.toLowerCase().includes(value) ||
      user.bio?.toLowerCase().includes(value)
    );
  });

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <p className="font-semibold text-pink-500">Discover</p>
          <h1 className="text-4xl font-black text-slate-900">Explore PistaGram</h1>
          <p className="mt-2 text-slate-500">
            Discover people who have created an account and connect with them.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <Users className="h-8 w-8 text-pink-500" />
            <p className="mt-4 text-3xl font-black">{me?.followers?.length || 0}</p>
            <p className="text-sm text-slate-500">Followers</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <UserPlus className="h-8 w-8 text-pink-500" />
            <p className="mt-4 text-3xl font-black">{me?.following?.length || 0}</p>
            <p className="text-sm text-slate-500">Following</p>
          </div>
        </div>

        <section className="mb-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">People to follow</h2>
              <p className="text-sm text-slate-500">
                All other registered PistaGram users appear here.
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading users...
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Users className="mx-auto h-10 w-10 text-pink-400" />
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {search ? "No user found" : "No other users yet"}
              </h2>
              <p className="mt-2 text-slate-500">
                {search
                  ? "Try another username or name."
                  : "Create another account to see it here."}
              </p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-black text-slate-900">
            Posts from people you follow
          </h2>

          {loadingPosts ? (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-400">
              Loading posts...
            </div>
          ) : posts.length ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} onDeleted={(id) => {
                  setPosts((current) => current.filter((item) => item._id !== id));
                }} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Compass className="mx-auto h-10 w-10 text-pink-400" />
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No posts to discover yet
              </h2>
              <p className="mt-2 text-slate-500">
                Follow some users and their posts will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default Explore;
