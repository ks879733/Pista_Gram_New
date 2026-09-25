import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
    <div>
      <p className="text-7xl font-black text-pink-500">404</p>
      <h1 className="mt-3 text-2xl font-bold">Page not found</h1>
      <Link to="/home" className="mt-5 inline-block rounded-xl bg-pink-500 px-5 py-3 font-semibold text-white">Back home</Link>
    </div>
  </div>
);

export default NotFound;
