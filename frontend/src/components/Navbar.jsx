import { Menu } from "lucide-react";

export default function Navbar({ onToggleSidebar }) {
  return (
    <header className="md:hidden p-4 flex items-center justify-between sticky top-0 z-40 bg-slate-50">
      <div className="flex items-center gap-3">
        {/* Burger Button for Mobile Screens */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-[#0d2702] transition-colors bg-white shadow-sm"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
