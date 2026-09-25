import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import Profile from "./pages/Profile";
import Message from "./pages/Message";
import NotFound from "./pages/NotFound";

const Protected = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/home" element={<Protected><Home /></Protected>} />
      <Route path="/explore" element={<Protected><Explore /></Protected>} />
      <Route path="/create-post" element={<Protected><CreatePost /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/profile/:userId" element={<Protected><Profile /></Protected>} />
      <Route path="/messages" element={<Protected><Message /></Protected>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
