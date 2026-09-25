import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  PlusSquare,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  Search,
} from "lucide-react";
import api from "../lib/api";

const navItems = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/create-post", label: "Post", icon: PlusSquare },
  { to: "/home", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/messages", label: "Message", icon: MessageCircle },
];

const Nav = () => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post("/user/logout");
    } catch (error) {
      // Even if the server rejects logout, clear the local access token.
    }

    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  const closeMenu = () => setOpen(false);

  return (
    <>
      {/* Desktop / tablet top navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/home"
            onClick={closeMenu}
            className="text-2xl font-black tracking-tight"
          >
            <span className="text-slate-900">Pista</span>
            <span className="text-pink-500">Gram</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/home"
              className="rounded-xl px-4 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-600"
            >
              <Home className="mr-2 inline h-5 w-5" /> Home
            </Link>
            <Link
              to="/explore"
              className="rounded-xl px-4 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-600"
            >
              <Compass className="mr-2 inline h-5 w-5" /> Explore
            </Link>
            <Link
              to="/create-post"
              className="rounded-xl px-4 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-600"
            >
              <PlusSquare className="mr-2 inline h-5 w-5" /> Create
            </Link>
            <Link
              to="/messages"
              className="rounded-xl px-4 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-600"
            >
              <MessageCircle className="mr-2 inline h-5 w-5" /> Messages
            </Link>
            <Link
              to="/profile"
              className="rounded-xl px-4 py-2 text-slate-700 hover:bg-pink-50 hover:text-pink-600"
            >
              <User className="mr-2 inline h-5 w-5" /> Profile
            </Link>
            <button
              onClick={logout}
              className="ml-2 rounded-xl px-4 py-2 text-slate-500 hover:bg-slate-100"
            >
              <LogOut className="mr-2 inline h-5 w-5" /> Logout
            </button>
          </div>

          <div className="hidden lg:flex items-center rounded-full bg-slate-100 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <span className="ml-2 text-sm text-slate-400">
              Find people in Explore
            </span>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white px-4 pb-4 md:hidden">
            <div className="mx-auto max-w-7xl space-y-1 pt-3">
              <Link onClick={closeMenu} to="/home" className="block rounded-xl px-4 py-3 hover:bg-pink-50">
                <Home className="mr-3 inline h-5 w-5" />Home
              </Link>
              <Link onClick={closeMenu} to="/explore" className="block rounded-xl px-4 py-3 hover:bg-pink-50">
                <Compass className="mr-3 inline h-5 w-5" />Explore
              </Link>
              <Link onClick={closeMenu} to="/create-post" className="block rounded-xl px-4 py-3 hover:bg-pink-50">
                <PlusSquare className="mr-3 inline h-5 w-5" />Create Post
              </Link>
              <Link onClick={closeMenu} to="/messages" className="block rounded-xl px-4 py-3 hover:bg-pink-50">
                <MessageCircle className="mr-3 inline h-5 w-5" />Messages
              </Link>
              <Link onClick={closeMenu} to="/profile" className="block rounded-xl px-4 py-3 hover:bg-pink-50">
                <User className="mr-3 inline h-5 w-5" />Profile
              </Link>
              <button
                onClick={logout}
                className="block w-full rounded-xl px-4 py-3 text-left text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-3 inline h-5 w-5" />Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile bottom navigation: Profile | Post | Home | Explore | Message */}
      <nav
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold text-slate-500 transition active:bg-slate-50"
            >
              <Icon className="h-5 w-5" strokeWidth={2.2} />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Nav;
