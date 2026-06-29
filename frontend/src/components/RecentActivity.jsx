import React from "react";
import { Activity } from "lucide-react";

export default function RecentActivity({ activities = [] }) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[#0d2702] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#71d300]" />
          System Activity Log
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-semibold">
            No recent activities available.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <div>
                <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mb-1 bg-slate-200 text-slate-700">
                  {act.type}
                </span>
                <p className="font-semibold text-slate-700">{act.message}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 shrink-0 ml-4">{act.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
