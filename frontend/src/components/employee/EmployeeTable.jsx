import React from "react";
import EmployeeTableRow from "./EmployeeTableRow";

export default function EmployeeTable({ employees }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3.5 px-6">Employee</th>
              <th className="py-3.5 px-6">Age</th>
              <th className="py-3.5 px-6">Phone</th>
              <th className="py-3.5 px-6">Email</th>
              <th className="py-3.5 px-6">Joined Date</th>
              <th className="py-3.5 px-6">Hour Rate</th>
              <th className="py-3.5 px-6">OT Hour Rate</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <EmployeeTableRow key={emp.uid} employee={emp} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
