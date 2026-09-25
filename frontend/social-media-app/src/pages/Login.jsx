import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, User, ArrowRight } from "lucide-react";
import api from "../lib/api";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!username.trim() || !password.trim()) {
      setMessage("Please fill in both username and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/user/login", {
        username: username.trim(),
        password,
      });

      localStorage.setItem("accessToken", response.data);
      navigate("/home");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fce7f3,_transparent_40%),radial-gradient(circle_at_bottom_right,_#ffedd5,_transparent_35%)] bg-slate-50 px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <p className="text-lg font-bold text-pink-500">Welcome to</p>
          <h1 className="mt-2 text-7xl font-black tracking-tight"><span className="text-slate-900">Pista</span><span className="text-pink-500">Gram</span></h1>
          <p className="mt-5 max-w-lg text-xl leading-8 text-slate-500">Share moments, discover people and chat with your circle in one simple social space.</p>
        </div>

        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white bg-white/95 p-7 shadow-2xl shadow-pink-100 sm:p-9">
          <div className="mb-8">
            <h2 className="text-3xl font-black">Welcome back</h2>
            <p className="mt-2 text-slate-500">Login to continue to your account.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">Username</label>
              <div className="flex items-center rounded-2xl bg-slate-100 px-4">
                <User className="h-5 w-5 text-slate-400" />
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your username" className="w-full bg-transparent px-3 py-3.5 outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Password</label>
              <div className="flex items-center rounded-2xl bg-slate-100 px-4">
                <LockKeyhole className="h-5 w-5 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="your password" className="w-full bg-transparent px-3 py-3.5 outline-none" />
              </div>
            </div>

            {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{message}</p>}

            <button disabled={loading} className="w-full rounded-2xl bg-slate-900 py-3.5 font-bold text-white hover:bg-pink-500 disabled:opacity-60">
              {loading ? "Logging in..." : <>Login <ArrowRight className="ml-1 inline h-5 w-5" /></>}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Don't have an account? <Link to="/register" className="font-bold text-pink-500">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
