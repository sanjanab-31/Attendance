import React from "react";
import { Filter, ArrowUpDown } from "lucide-react";

export default function Filters({
  joiningDateFilter,
  onJoiningDateChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
      {/* Joining Date Filter */}
      <div>
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Joined On/After</label>
        <input
          type="date"
          value={joiningDateFilter}
          onChange={(e) => onJoiningDateChange(e.target.value)}
          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-700 outline-none focus:border-[#71d300]"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-700 outline-none focus:border-[#71d300]"
        >
          <option value="all">All Employees</option>
          <option value="active">Active Only</option>
        </select>
      </div>

      {/* Sort By Field */}
      <div>
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-700 outline-none focus:border-[#71d300]"
        >
          <option value="name">Employee Name</option>
          <option value="dateOfJoining">Date Joined</option>
        </select>
      </div>

      {/* Sort Order Direction */}
      <div>
        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Direction</label>
        <select
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value)}
          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-700 outline-none focus:border-[#71d300]"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );
}
