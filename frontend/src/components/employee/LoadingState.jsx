import React from "react";

export default function LoadingState() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm animate-pulse">
      <div className="bg-slate-50 border-b border-slate-200 h-10 w-full"></div>
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3 w-1/3">
              <div className="w-8 h-8 rounded-full bg-slate-200"></div>
              <div className="space-y-2 w-2/3">
                <div className="h-3 bg-slate-200 rounded"></div>
                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-3 bg-slate-200 rounded w-20"></div>
            <div className="h-3 bg-slate-200 rounded w-24"></div>
            <div className="h-3 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
