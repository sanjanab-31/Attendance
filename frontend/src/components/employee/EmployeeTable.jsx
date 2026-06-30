import React from "react";
import EmployeeTableRow from "./EmployeeTableRow";

export default function EmployeeTable({ employees }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
      <div className="bg-slate-50 border-b border-slate-200 pr-1.5"> {/* pr-1.5 compensates for thin-scrollbar width visually */}
        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,0.5fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 items-center">
          <div>Employee</div>
          <div>Age</div>
          <div>Phone</div>
          <div>Email</div>
          <div>Hour Rate</div>
          <div>OT Hour Rate</div>
          <div className="text-right">Actions</div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-auto thin-scrollbar bg-white">
        <div className="flex flex-col">
          {employees.map((emp) => (
            <EmployeeTableRow key={emp.uid} employee={emp} />
          ))}
        </div>
      </div>
    </div>
  );
}
