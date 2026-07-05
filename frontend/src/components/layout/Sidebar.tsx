import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Building2, Package, Wrench, MessageSquare,
  Users, Car, CalendarDays, Zap, Bell, UserCircle, LogOut, ShieldCheck,
  ShieldAlert, BrainCircuit
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { to: "/",             label: "Dashboard",     icon: LayoutDashboard, roles: ["all"] },
  { to: "/buildings",    label: "Buildings",     icon: Building2,       roles: ["super_admin"] },
  { to: "/assets",       label: "Assets",        icon: Package,         roles: ["super_admin","building_manager","maintenance_staff"] },
  { to: "/maintenance",  label: "Maintenance",   icon: Wrench,          roles: ["super_admin","building_manager","maintenance_staff"] },
  { to: "/complaints",   label: "Complaints",    icon: MessageSquare,   roles: ["all"] },
  { to: "/visitors",     label: "Visitors",      icon: ShieldCheck,     roles: ["super_admin","building_manager","security_staff"] },
  { to: "/security",     label: "Security Logs", icon: ShieldAlert,     roles: ["super_admin","building_manager","security_staff"] },
  { to: "/parking",      label: "Parking",       icon: Car,             roles: ["all"] },
  { to: "/bookings",     label: "Bookings",      icon: CalendarDays,    roles: ["all"] },
  { to: "/energy",       label: "Energy",        icon: Zap,             roles: ["super_admin","building_manager"] },
  { to: "/simulator",    label: "AI Simulator",  icon: BrainCircuit,    roles: ["super_admin","building_manager"] },
  { to: "/notifications",label: "Notifications", icon: Bell,            roles: ["all"] },
  { to: "/users",        label: "Users",         icon: Users,           roles: ["super_admin"] },
  { to: "/profile",      label: "Profile",       icon: UserCircle,      roles: ["all"] },
];

export default function Sidebar({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { user, logout } = useAuth();

  const visible = NAV.filter((n) => n.roles.includes("all") || n.roles.includes(user?.role || ""));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={clsx(
        "fixed top-0 left-0 h-full w-[240px] bg-[#0a0a0f] border-r border-[#2a2a3a] z-50 flex flex-col transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-[#2a2a3a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="font-[600] text-[15px] text-[#f1f1f3]">Digital Twin AI</p>
              <p className="text-[12px] text-[#8b8b9e] capitalize font-medium">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 overflow-y-auto space-y-1 px-3">
          {visible.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-[500] transition-all duration-150 border-l-[3px]",
                isActive
                  ? "border-[#6366f1] bg-[rgba(99,102,241,0.05)] text-[#6366f1]"
                  : "border-transparent text-[#8b8b9e] hover:bg-[#111118] hover:text-[#f1f1f3]"
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? "text-[#6366f1]" : ""} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2a2a3a] bg-[#111118]/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-[#2a2a3a] flex items-center justify-center text-[#f1f1f3] font-[600] text-sm border border-[#3d3d55]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-[500] text-[#f1f1f3] truncate">{user?.name}</p>
              <p className="text-[12px] text-[#55556a] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 text-[13px] font-[500] text-[#8b8b9e] hover:text-[#f1f1f3] transition-colors px-3 py-2 rounded-lg hover:bg-[#1a1a24]">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
