import React from "react";
import { Link } from "react-router-dom";

export default function QuickAction({ to, label, icon: Icon }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-primary/10 border border-slate-200 rounded-lg text-center transition-colors"
    >
      <Icon className="w-5 h-5 text-primary-dark mb-1.5" />
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{label}</span>
    </Link>
  );
}
