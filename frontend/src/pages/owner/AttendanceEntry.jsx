import { useEffect, useState, useRef } from "react";
import { getActiveEmployees, getAttendanceForDate, saveAttendanceRecord } from "../../services/attendanceService";
import { useAuth } from "../../context/AuthContext";
import { Calendar, ChevronLeft, ChevronRight, Save, X, CalendarDays } from "lucide-react";

import AttendanceTable from "../../components/attendance/AttendanceTable";
import CustomDatePicker from "../../components/CustomDatePicker";

export default function AttendanceEntry() {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [draftRecords, setDraftRecords] = useState({});
  const [originalRecords, setOriginalRecords] = useState({});
  const dateInputRef = useRef(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadRosterAndLogs = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      
      const roster = await getActiveEmployees();
      setEmployees(roster);

      const logsMap = await getAttendanceForDate(selectedDate);
      
      // Map to proper structure for new UI
      const formattedLogs = {};
      roster.forEach(emp => {
        const log = logsMap[emp.uid] || {};
        formattedLogs[emp.uid] = {
          status: log.status || "Present",
          workingHours: log.workingHours !== undefined ? log.workingHours.toString() : "8",
          otHours: log.otHours !== undefined ? log.otHours.toString() : "0",
          isHoliday: !!log.isHoliday,
          remarks: log.remarks || ""
        };
      });

      setOriginalRecords(JSON.parse(JSON.stringify(formattedLogs)));
      setDraftRecords(formattedLogs);
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to load records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRosterAndLogs();
  }, [selectedDate]);

  const handleDateChange = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleRowChange = (uid, newRecord) => {
    setDraftRecords(prev => ({
      ...prev,
      [uid]: newRecord
    }));
  };

  const handleDiscard = () => {
    setDraftRecords(JSON.parse(JSON.stringify(originalRecords)));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      const promises = employees.map(emp => {
        const rec = draftRecords[emp.uid];
        const wh = parseFloat(rec.workingHours) || 0;
        const ot = parseFloat(rec.otHours) || 0;
        
        const saveRec = {
          name: emp.name,
          hourRate: emp.hourRate || 0,
          otHourRate: emp.otHourRate || 0,
          workingHours: rec.isHoliday ? 0 : wh,
          otHours: rec.isHoliday ? 0 : ot,
          isHoliday: rec.isHoliday,
          remarks: rec.remarks.trim(),
          status: rec.status
        };
        return saveAttendanceRecord(emp.uid, selectedDate, saveRec, currentUser);
      });

      await Promise.all(promises);
      setOriginalRecords(JSON.parse(JSON.stringify(draftRecords)));
      setSuccessMsg("All records saved successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save records.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const [y, m, d] = dateString.split("-");
    return `${d}-${m}-${y}`;
  };

  // Stats
  const totalStaff = employees.length;
  const presentCount = Object.values(draftRecords).filter(r => r.status === "Present").length;
  const absentCount = Object.values(draftRecords).filter(r => r.status === "Absent").length;
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-dark">Daily Attendance Log</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Record and update daily workforce performance metrics.
          </p>
        </div>
        
        {/* Date Picker */}
        <CustomDatePicker
          selectedDate={selectedDate}
          onChange={setSelectedDate}
          onPrevDay={() => handleDateChange(-1)}
          onNextDay={() => handleDateChange(1)}
        />
      </div>

      {/* Summary Cards
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL STAFF</div>
          <div className="text-3xl font-black text-slate-800">{totalStaff}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">PRESENT</div>
          <div className="text-3xl font-black text-emerald-600">{presentCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ABSENT</div>
          <div className="text-3xl font-black text-rose-600">{absentCount}</div>
        </div>
      </div>
      */}

      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-semibold">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Main Table Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>
        ) : (
          <AttendanceTable
            employees={employees}
            attendanceRecords={draftRecords}
            onChange={handleRowChange}
            dateStr={selectedDate}
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-4 flex justify-end gap-4 items-center">
        <button
          onClick={handleDiscard}
          disabled={saving}
          className="px-6 py-2.5 border border-slate-200 text-slate-600 hover:text-primary-dark hover:border-primary-dark font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Discard Changes
        </button>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-primary-dark text-white font-bold text-sm rounded-lg hover:bg-primary-dark/90 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
        >
          {saving ? "Saving..." : (
            <>
              <Save className="w-4 h-4" />
              Save All Records
            </>
          )}
        </button>
      </div>
    </div>
  );
}
