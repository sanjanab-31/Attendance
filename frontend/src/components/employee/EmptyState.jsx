import React from "react";
import { Link } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        <Users className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-[#0d2702]">No Employees Found</h3>
      <p className="text-slate-400 text-xs font-semibold mt-1 max-w-xs">
        There are currently no employee records matching your active filters.
      </p>
      <Link
        to="/owner/employees/new"
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#0d2702] hover:bg-[#163c03] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
      >
        <UserPlus className="w-4 h-4" />
        Add Employee
      </Link>
    </div>
  );
}
