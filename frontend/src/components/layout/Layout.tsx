import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu, Bell, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/axios";
import { Link } from "react-router-dom";

function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const { data } = useQuery({
    queryKey: ["notif-count"],
    queryFn: () => api.get("/notifications").then(r => r.data.data.unreadCount),
    refetchInterval: 30000,
  });

  const getPageTitle = () => {
    const path = location.pathname.substring(1).split("/")[0];
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1).replace("-", " ");
  };

  return (
    <header className="h-[56px] bg-[#0a0a0f] border-b border-[#2a2a3a] flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden btn-ghost p-1.5 -ml-1.5">
          <Menu size={20} className="text-[#8b8b9e]" />
        </button>
        <h1 className="text-[15px] font-[600] text-[#f1f1f3]">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="text-[#8b8b9e] hover:text-[#f1f1f3] transition-colors p-1.5 hidden sm:block">
          <Search size={18} />
        </button>
        <Link to="/notifications" className="relative text-[#8b8b9e] hover:text-[#f1f1f3] transition-colors p-1.5">
          <Bell size={18} />
          {data > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full border border-[#0a0a0f]" />
          )}
        </Link>
        <div className="h-4 w-[1px] bg-[#2a2a3a] mx-1 hidden sm:block"></div>
        <Link to="/profile" className="w-7 h-7 rounded-full bg-[#2a2a3a] flex items-center justify-center text-[#f1f1f3] font-[600] text-xs border border-[#3d3d55] hover:border-[#6366f1] transition-colors">
          {user?.name?.charAt(0).toUpperCase()}
        </Link>
      </div>
    </header>
  );
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-[240px]">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 text-[#f1f1f3]">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
