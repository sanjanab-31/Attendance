import React from "react";
import { Link } from "react-router-dom";
import { User, ArrowRight } from "lucide-react";

export default function EmployeeTableRow({ employee }) {
  const hourRate = employee.hourRate !== undefined ? parseFloat(employee.hourRate) : 0;
  const otHourRate = employee.otHourRate !== undefined ? parseFloat(employee.otHourRate) : 0;

  return (
    <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-6 py-3 items-center hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 text-sm bg-white">
      <div>
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold text-slate-900">{employee.name}</div>
          </div>
        </div>
      </div>
      <div className="text-slate-600 font-medium">{employee.age} yrs</div>
      <div className="text-slate-600 font-medium">{employee.phone?.replace(/^\+\d{1,3}\s?-?/, '')}</div>
      <div className="text-slate-600 font-medium truncate pr-2">{employee.email}</div>
      <div className="text-slate-700 font-medium">${hourRate.toFixed(2)}/hr</div>
      <div className="text-slate-700 font-medium">${otHourRate.toFixed(2)}/hr</div>

      <div className="text-right">
        <Link
          to={`/owner/employees/${employee.uid}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-dark hover:text-primary bg-slate-100 hover:bg-slate-200/50 px-3 py-1.5 rounded-lg transition-colors"
        >
          View 
        </Link>
      </div>
    </div>
  );
}
