import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { History, Filter, Search } from "lucide-react";

export default function EmployeeAttendance() {
  const { currentUser } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date Filters
  const [datePreset, setDatePreset] = useState("thisMonth"); // "today", "thisWeek", "thisMonth", "thisYear", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchDateText, setSearchDateText] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "attendance"),
      where("uid", "==", currentUser.uid)
    );

    // Real-time listener for automated updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        logs.sort((a, b) => b.date.localeCompare(a.date));
        setAttendance(logs);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to stream employee attendance logs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Apply filters
  const getFilteredLogs = () => {
    const today = new Date();
    let limitDateStr = "";

    if (datePreset === "today") {
      limitDateStr = today.toISOString().split("T")[0];
    } else if (datePreset === "thisWeek") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      limitDateStr = oneWeekAgo.toISOString().split("T")[0];
    } else if (datePreset === "thisMonth") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(today.getDate() - 30);
      limitDateStr = oneMonthAgo.toISOString().split("T")[0];
    } else if (datePreset === "thisYear") {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(today.getDate() - 365);
      limitDateStr = oneYearAgo.toISOString().split("T")[0];
    }

    return attendance.filter((log) => {
      // 1. Text date search matching
      if (searchDateText && !log.date.includes(searchDateText)) return false;

      // 2. Range filter
      if (datePreset === "custom") {
        if (startDate && log.date < startDate) return false;
        if (endDate && log.date > endDate) return false;
      } else if (limitDateStr) {
        if (log.date < limitDateStr || log.date > today.toISOString().split("T")[0]) return false;
      }

      return true;
    });
  };

  const filteredAttendance = getFilteredLogs();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/4"></div>
        <div className="h-40 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-dark flex items-center gap-3">
            <History className="w-7 h-7 text-primary-dark" />
            My Attendance History
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs font-semibold">
            Complete running ledger of your logged shifts, regular/OT hours, and daily earnings.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
          {/* Text Search date */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search date (YYYY-MM-DD)..."
              value={searchDateText}
              onChange={(e) => setSearchDateText(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 focus:border-primary rounded-lg text-xs outline-none w-48"
            />
          </div>

          {/* Timeframe Presets */}
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-primary"
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {datePreset === "custom" && (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Attendance Logs Table */}
      {filteredAttendance.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg text-slate-400 font-semibold text-xs shadow-sm">
          No attendance records found matching parameters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Shift Date</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-center">Working Hours</th>
                  <th className="py-3 px-6 text-center">OT Hours</th>
                  <th className="py-3 px-6">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredAttendance.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{log.date}</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        log.isHoliday
                          ? "bg-amber-100 text-amber-800 border border-amber-200/50"
                          : "bg-primary/15 text-primary-dark border border-primary/25"
                      }`}>
                        {log.isHoliday ? "Holiday" : "Work"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center text-slate-600">{log.isHoliday ? "-" : log.workingHours}</td>
                    <td className="py-3.5 px-6 text-center text-slate-600">{log.isHoliday ? "-" : log.otHours}</td>
                    <td className="py-3.5 px-6 text-slate-400 italic max-w-xs truncate">{log.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
