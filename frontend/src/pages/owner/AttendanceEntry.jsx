import { useEffect, useState } from "react";
import { getActiveEmployees, getAttendanceForDate } from "../../services/attendanceService";
import { Calendar, Filter, Users, Loader2, History, ClipboardList } from "lucide-react";

// Import Reusable Subcomponents
import AttendanceTable from "../../components/attendance/AttendanceTable";
import AttendanceHistoryList from "../../components/attendance/AttendanceHistoryList";

export default function AttendanceEntry() {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [activeTab, setActiveTab] = useState("daily"); // "daily" or "history"

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (activeTab !== "daily") return;

    async function loadRosterAndLogs() {
      try {
        setLoading(true);
        setErrorMsg("");
        
        // 1. Fetch active employees
        const roster = await getActiveEmployees();
        setEmployees(roster);

        // 2. Fetch logged records for selected date
        const logsMap = await getAttendanceForDate(selectedDate);
        setAttendanceRecords(logsMap);
      } catch (error) {
        console.error(error);
        setErrorMsg("Failed to sync employee attendance records.");
      } finally {
        setLoading(false);
      }
    }

    loadRosterAndLogs();
  }, [selectedDate, activeTab]);

  // Calendar Logic
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  
  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const currentMonthName = viewDate.toLocaleString('default', { month: 'long' });

  // Generate 25 months (12 months back, current month, 12 months ahead)
  const availableMonths = Array.from({ length: 25 }, (_, i) => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + (i - 12), 1);
  });

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(viewYear, viewMonth, i + 1);
    const m = String(viewMonth + 1).padStart(2, '0');
    const day = String(i + 1).padStart(2, '0');
    return `${viewYear}-${m}-${day}`;
  });

  // Scroll to active month on load (basic effect)
  useEffect(() => {
    const activeMonthBtn = document.getElementById(`month-btn-${viewYear}-${viewMonth}`);
    if (activeMonthBtn) {
      activeMonthBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [viewYear, viewMonth]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0d2702] flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#0d2702]" />
            Roster & Attendance Logs
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs font-semibold">
            Log daily employee shifts, edit past logs, and inspect changes history.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === "daily"
                ? "bg-[#71d300] text-[#0d2702]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Log Sheet
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === "history"
                ? "bg-[#71d300] text-[#0d2702]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History className="w-4 h-4" />
            Logs History
          </button>
        </div>
      </div>

      {/* Render Daily Log Sheet tab */}
      {activeTab === "daily" && (
        <div className="space-y-6">
          <div className="flex flex-col bg-slate-200/60 pt-6 pb-4 border border-slate-200/50 rounded-3xl shadow-inner gap-4 relative overflow-hidden">
            
            {/* Scrollable Month / Year Header */}
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar pb-2 px-6 z-10 relative snap-x w-full">
              {availableMonths.map((m, idx) => {
                const mYear = m.getFullYear();
                const mMonth = m.getMonth();
                const isSelected = mYear === viewYear && mMonth === viewMonth;
                return (
                  <button 
                     key={idx}
                     id={`month-btn-${mYear}-${mMonth}`}
                     onClick={() => setViewDate(m)}
                     className={`shrink-0 text-sm font-bold transition-all duration-300 snap-center ${
                       isSelected ? "text-slate-800 scale-125 mx-2" : "text-slate-400 hover:text-slate-600 scale-100"
                     }`}
                  >
                    {m.toLocaleString('default', { month: 'long' })} <span className={isSelected ? "text-slate-500 font-normal" : "font-normal"}>{mYear}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Smooth Date Selector */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 px-4 no-scrollbar z-10 relative snap-x">
              {daysArray.map(dateStr => {
                const dateObj = new Date(dateStr);
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: 'short' });
                const dayNum = dateObj.getDate();
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;

                // Auto-scroll to selected date on mount could be done with a ref, but keeping it simple
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                    }}
                    className={`relative flex flex-col items-center justify-center w-[64px] h-[88px] rounded-2xl transition-all duration-300 shrink-0 snap-center ${
                      isSelected 
                        ? "bg-white text-slate-900 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.15)] scale-110 z-20" 
                        : "bg-white/70 text-slate-500 hover:bg-white scale-[0.95] hover:scale-100 opacity-80 hover:opacity-100 shadow-sm"
                    }`}
                  >
                    {!isSelected && (
                      <div className="absolute top-2.5 flex gap-1 opacity-50">
                        <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                      </div>
                    )}
                    
                    {isToday && !isSelected && (
                       <span className="absolute top-1 text-[8px] font-bold text-blue-500 uppercase tracking-widest">Today</span>
                    )}

                    <span className={`text-[22px] font-black mt-2 leading-none ${isSelected ? "text-slate-800" : ""}`}>
                      {dayNum.toString().padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-semibold mt-1">
                      {dayName}
                    </span>
                    
                    {isSelected && (
                      <div className="absolute bottom-2 w-4 h-[3px] rounded-full bg-blue-600"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 shadow-sm flex flex-col items-center justify-center min-h-[30vh] text-slate-400 text-xs font-bold gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-[#0d2702]" />
              <span>Synchronizing records...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#0d2702]">No Employees Found</h3>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                Create employee accounts first to log daily shift activities.
              </p>
            </div>
          ) : (
            <AttendanceTable
              employees={employees}
              attendanceRecords={attendanceRecords}
              dateStr={selectedDate}
            />
          )}
        </div>
      )}

      {/* Render History Tab */}
      {activeTab === "history" && <AttendanceHistoryList />}
    </div>
  );
}
