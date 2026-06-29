import React from "react";

export default function SummaryCard({ title, value, icon: Icon, valueClass = "text-[#0d2702]" }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className={`text-3xl font-extrabold mt-1 ${valueClass}`}>{value}</h3>
        </div>
        {Icon && (
          <div className="p-3 bg-[#71d300]/10 border border-[#71d300]/25 rounded-lg text-[#0d2702]">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
