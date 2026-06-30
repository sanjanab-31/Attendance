import React from "react";
import { Search } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        placeholder="Search by name, phone, or email..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-slate-900 placeholder-slate-400 outline-none text-xs"
      />
    </div>
  );
}
