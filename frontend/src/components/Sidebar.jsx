import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileBarChart2,
  User,
  DollarSign,
  History
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.role === "owner";

  const ownerLinks = [
    { to: "/owner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/owner/employees", label: "Manage Employees", icon: Users },
    { to: "/owner/attendance", label: "Daily Attendance", icon: CalendarCheck },
    { to: "/owner/reports", label: "Reports & Analytics", icon: FileBarChart2 },
    { to: "/owner/profile", label: "Owner Profile", icon: User }
  ];

  const employeeLinks = [
    { to: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/employee/attendance", label: "Attendance History", icon: History },
    { to: "/employee/payments", label: "Payroll Details", icon: DollarSign },
    { to: "/employee/profile", label: "My Profile", icon: User }
  ];

  const links = isOwner ? ownerLinks : employeeLinks;

  return (
    <aside
      className={`fixed md:sticky top-16 bottom-0 left-0 w-64 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-4rem)] z-40 transition-transform duration-300 transform md:transform-none ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose} // Auto-close sidebar on mobile after clicking
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? "bg-[#71d300] text-[#0d2702]"
                    : "text-slate-600 hover:text-[#0d2702] hover:bg-slate-50"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
