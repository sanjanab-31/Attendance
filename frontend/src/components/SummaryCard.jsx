import React from "react";

export default function SummaryCard({ title, value, icon: Icon, valueClass = "text-primary-dark" }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className={`text-3xl font-extrabold mt-1 ${valueClass}`}>{value}</h3>
        </div>
        {Icon && (
          <div className="p-3 bg-primary/10 border border-primary/25 rounded-lg text-primary-dark">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
