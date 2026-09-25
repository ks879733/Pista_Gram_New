import React from "react";
import Nav from "./Nav";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav />
      <main className="pb-0 md:pb-0 pb-20">{children}</main>
    </div>
  );
};

export default MainLayout;
