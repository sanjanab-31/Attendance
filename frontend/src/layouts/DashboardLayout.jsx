import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans relative overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Backdrop when Sidebar is Open */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Scrollable Main Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
