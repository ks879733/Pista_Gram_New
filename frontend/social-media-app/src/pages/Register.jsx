import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, User, ArrowRight } from "lucide-react";
import api from "../lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!username.trim() || !email.trim() || !password.trim()) {
      setMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/user/", {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      localStorage.setItem("accessToken", response.data);
      navigate("/home");
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#fce7f3,_transparent_40%),radial-gradient(circle_at_bottom_left,_#ffedd5,_transparent_35%)] bg-slate-50 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <div className="w-full rounded-[2rem] border border-white bg-white/95 p-7 shadow-2xl shadow-pink-100 sm:p-9">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black"><span className="text-slate-900">Pista</span><span className="text-pink-500">Gram</span></h1>
            <p className="mt-2 text-slate-500">Create your account and join the community.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex items-center rounded-2xl bg-slate-100 px-4">
              <User className="h-5 w-5 text-slate-400" />
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-transparent px-3 py-3.5 outline-none" />
            </div>

            <div className="flex items-center rounded-2xl bg-slate-100 px-4">
              <Mail className="h-5 w-5 text-slate-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full bg-transparent px-3 py-3.5 outline-none" />
            </div>

            <div className="flex items-center rounded-2xl bg-slate-100 px-4">
              <LockKeyhole className="h-5 w-5 text-slate-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-transparent px-3 py-3.5 outline-none" />
            </div>

            {message && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{message}</p>}

            <button disabled={loading} className="w-full rounded-2xl bg-pink-500 py-3.5 font-bold text-white hover:bg-pink-600 disabled:opacity-60">
              {loading ? "Creating account..." : <>Create Account <ArrowRight className="ml-1 inline h-5 w-5" /></>}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Already have an account? <Link to="/login" className="font-bold text-pink-500">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
