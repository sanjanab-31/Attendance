import React from "react";
import AttendanceRow from "./AttendanceRow";

export default function AttendanceTable({ employees, attendanceRecords, dateStr }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <th className="py-3.5 px-6">Employee</th>
              <th className="py-3.5 px-6">Active Rates</th>
              <th className="py-3.5 px-6">Working Hours</th>
              <th className="py-3.5 px-6">Overtime Hours</th>
              <th className="py-3.5 px-6 text-center">Holiday</th>
              <th className="py-3.5 px-6">Remarks</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <AttendanceRow
                key={emp.uid}
                employee={emp}
                initialRecord={attendanceRecords[emp.uid]}
                dateStr={dateStr}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
