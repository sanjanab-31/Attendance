import { useState, useEffect } from "react";
import { subscribeToAllAttendance, updateAttendanceWithHistory } from "../../services/attendanceService";
import { useAuth } from "../../context/AuthContext";
import { Search, Filter, Calendar, Edit2, Check, X, AlertCircle } from "lucide-react";

export default function AttendanceHistoryList() {
  const { currentUser } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilterType, setDateFilterType] = useState("all"); // "all", "daily", "weekly", "monthly", "custom", "holiday"
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split("T")[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Editing Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ workingHours: "", otHours: "", isHoliday: false, remarks: "" });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    // Listen to all attendance logs in real time
    const unsubscribe = subscribeToAllAttendance(
      (data) => {
        setRecords(data);
        setLoading(false);
      },
      (err) => {
        setErrorMsg("Failed to synchronize attendance history ledger.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter logs logic
  const filteredRecords = records.filter((rec) => {
    // 1. Search by employee name
    const matchesSearch = rec.name.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Date filters
    let matchesDate = true;
    const recDate = rec.date;
    const today = new Date();

    if (dateFilterType === "daily") {
      matchesDate = recDate === singleDate;
    } else if (dateFilterType === "weekly") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      const limitStr = oneWeekAgo.toISOString().split("T")[0];
      matchesDate = recDate >= limitStr && recDate <= today.toISOString().split("T")[0];
    } else if (dateFilterType === "monthly") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(today.getDate() - 30);
      const limitStr = oneMonthAgo.toISOString().split("T")[0];
      matchesDate = recDate >= limitStr && recDate <= today.toISOString().split("T")[0];
    } else if (dateFilterType === "custom") {
      if (startDate && recDate < startDate) matchesDate = false;
      if (endDate && recDate > endDate) matchesDate = false;
    } else if (dateFilterType === "holiday") {
      matchesDate = !!rec.isHoliday;
    }

    return matchesSearch && matchesDate;
  });

  const startEdit = (rec) => {
    setEditingRecord(rec);
    setEditForm({
      workingHours: rec.workingHours.toString(),
      otHours: rec.otHours.toString(),
      isHoliday: !!rec.isHoliday,
      remarks: rec.remarks || ""
    });
    setEditError("");
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError("");

    const wh = parseFloat(editForm.workingHours);
    const ot = parseFloat(editForm.otHours);

    if (editForm.workingHours === "" && !editForm.isHoliday) {
      setEditError("Working hours required.");
      return;
    }
    if (isNaN(wh) || wh < 0) {
      setEditError("Hours cannot be negative.");
      return;
    }
    if (editForm.otHours !== "" && (isNaN(ot) || ot < 0)) {
      setEditError("OT hours cannot be negative.");
      return;
    }

    setEditLoading(true);
    try {
      const newRecord = {
        workingHours: editForm.isHoliday ? 0 : wh,
        otHours: editForm.isHoliday ? 0 : (editForm.otHours === "" ? 0 : ot),
        isHoliday: editForm.isHoliday,
        remarks: editForm.remarks.trim()
      };

      await updateAttendanceWithHistory(editingRecord.id, editingRecord, newRecord, currentUser);
      setEditingRecord(null);
    } catch (err) {
      setEditError("Failed to update attendance log.");
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-10 flex items-center justify-center text-xs font-bold text-slate-400">
        Syncing history database...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
        {/* Name Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Employee Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#71d300] focus:ring-1 focus:ring-[#71d300] rounded-lg text-xs outline-none"
          />
        </div>

        {/* Filter Type */}
        <div className="flex gap-2">
          <Filter className="w-4 h-4 text-slate-400 self-center" />
          <select
            value={dateFilterType}
            onChange={(e) => setDateFilterType(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#71d300]"
          >
            <option value="all">All Dates</option>
            <option value="daily">Single Day</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="custom">Custom Date Range</option>
            <option value="holiday">Holidays Only</option>
          </select>
        </div>

        {/* Conditional Date inputs */}
        {dateFilterType === "daily" && (
          <input
            type="date"
            value={singleDate}
            onChange={(e) => setSingleDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#71d300]"
          />
        )}

        {dateFilterType === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#71d300]"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#71d300]"
            />
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* History Data Table */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg text-slate-400 font-semibold text-xs shadow-sm">
          No attendance records found matching filters.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Employee</th>
                  <th className="py-3 px-6 text-center">Working Hours</th>
                  <th className="py-3 px-6 text-center">OT Hours</th>
                  <th className="py-3 px-6 text-center">Holiday</th>
                  <th className="py-3 px-6">Remarks</th>
                  <th className="py-3 px-6">Edited At / By</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{rec.date}</td>
                    <td className="py-3.5 px-6 text-slate-900 font-bold">{rec.name}</td>
                    <td className="py-3.5 px-6 text-center text-slate-600 font-medium">{rec.isHoliday ? "-" : rec.workingHours}</td>
                    <td className="py-3.5 px-6 text-center text-slate-600 font-medium">{rec.isHoliday ? "-" : rec.otHours}</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        rec.isHoliday ? "bg-amber-100 text-amber-800" : "bg-[#71d300]/15 text-[#0d2702]"
                      }`}>
                        {rec.isHoliday ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 italic max-w-xs truncate">{rec.remarks || "-"}</td>
                    <td className="py-3.5 px-6 text-[10px] text-slate-400 font-medium font-mono">
                      <div>On: {rec.lastEditedDate || "-"}</div>
                      <div className="font-bold">By: {rec.lastEditedBy || "-"}</div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => startEdit(rec)}
                        className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-[#0d2702] transition-colors"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Entry Modal Overlay */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[#0d2702]">Edit Attendance Entry</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{editingRecord.name} | {editingRecord.date}</p>
              </div>
              <button onClick={() => setEditingRecord(null)} className="p-1 hover:bg-slate-50 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="editHoliday"
                  checked={editForm.isHoliday}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEditForm(prev => ({
                      ...prev,
                      isHoliday: checked,
                      workingHours: checked ? "0" : "",
                      otHours: checked ? "0" : ""
                    }));
                  }}
                  className="w-4 h-4 text-[#71d300] border-slate-300 focus:ring-[#71d300] rounded cursor-pointer"
                />
                <label htmlFor="editHoliday" className="text-xs font-bold text-slate-600 cursor-pointer select-none">Mark as Holiday</label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Working Hours</label>
                  <input
                    type="number"
                    disabled={editForm.isHoliday}
                    value={editForm.workingHours}
                    onChange={(e) => setEditForm(prev => ({ ...prev, workingHours: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">OT Hours</label>
                  <input
                    type="number"
                    disabled={editForm.isHoliday}
                    value={editForm.otHours}
                    onChange={(e) => setEditForm(prev => ({ ...prev, otHours: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Remarks</label>
                <textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none resize-none"
                  rows="2"
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-[#0d2702] hover:bg-[#163c03] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
