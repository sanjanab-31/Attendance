import React from "react";
import AttendanceRow from "./AttendanceRow";

export default function AttendanceTable({ employees, attendanceRecords, onChange, dateStr }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
      <style>{`
        .thin-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .thin-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      
      {/* Header Table (No Scrollbar) */}
      <div className="w-full bg-slate-50 border-b border-slate-200 shadow-sm z-10 pr-[4px]">
        <div className="overflow-hidden">
          <table className="w-full text-left text-xs table-fixed min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-primary-dark uppercase text-[11px] font-black tracking-wider">
                <th className="py-4 px-6 w-[25%]">EMPLOYEE NAME</th>
                <th className="py-4 px-6 w-[15%]">STATUS</th>
                <th className="py-4 px-6 w-[15%]">WORK HOURS</th>
                <th className="py-4 px-6 w-[15%]">OVERTIME</th>
                <th className="py-4 px-6 w-[10%]">HOLIDAY</th>
                <th className="py-4 px-6 w-[20%]">REMARKS</th>
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {/* Body Table (Scrollable) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar relative">
        <table className="w-full text-left text-xs table-fixed min-w-[800px] border-collapse">
          <tbody>
            {employees.map((emp) => (
              <AttendanceRow
                key={emp.uid}
                employee={emp}
                record={attendanceRecords[emp.uid]}
                onChange={(newRecord) => onChange(emp.uid, newRecord)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
