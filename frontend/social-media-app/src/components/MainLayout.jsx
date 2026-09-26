import React from "react";
import Nav from "./Nav";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Nav />
      <main className="pt-16 pb-20 md:pb-0">{children}</main>
    </div>
  );
};

export default MainLayout;
