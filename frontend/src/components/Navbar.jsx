import { useAuth } from "../context/AuthContext";
import { LogOut, User, Sparkles, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ onToggleSidebar }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  }

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Burger Button for Mobile Screens */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-[#0d2702] md:hidden transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Sparkles className="w-5 h-5 text-[#71d300]" />
        <span className="font-bold text-[#0d2702] tracking-tight text-sm md:text-base">
          ESA ATTENDANCE
        </span>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-[#0d2702]">
              {currentUser?.name || "Loading..."}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              {currentUser?.role || "user"}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
