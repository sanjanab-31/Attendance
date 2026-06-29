import React from "react";
import { Link } from "react-router-dom";
import { User, ArrowRight } from "lucide-react";

export default function EmployeeTableRow({ employee }) {
  const hourRate = employee.hourRate !== undefined ? parseFloat(employee.hourRate) : 0;
  const otHourRate = employee.otHourRate !== undefined ? parseFloat(employee.otHourRate) : 0;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-3 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <User className="w-4 h-4 text-[#0d2702]" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{employee.name}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-6 text-slate-600 font-medium">{employee.age} yrs</td>
      <td className="py-3 px-6 text-slate-600 font-medium">{employee.phone?.replace(/^\+\d{1,3}\s?-?/, '')}</td>
      <td className="py-3 px-6 text-slate-600 font-medium">{employee.email}</td>
      <td className="py-3 px-6 text-slate-600 font-medium">{employee.dateOfJoining}</td>
      <td className="py-3 px-6 text-slate-700 font-bold">${hourRate.toFixed(2)}/hr</td>
      <td className="py-3 px-6 text-slate-700 font-bold">${otHourRate.toFixed(2)}/hr</td>

      <td className="py-3 px-6 text-right">
        <Link
          to={`/owner/employees/${employee.uid}`}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0d2702] hover:text-[#71d300] bg-slate-100 hover:bg-slate-200/50 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          View Profile
          <ArrowRight className="w-3 h-3" />
        </Link>
      </td>
    </tr>
  );
}
