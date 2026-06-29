import { useState, useEffect } from "react";
import { saveAttendanceRecord } from "../../services/attendanceService";
import { useAuth } from "../../context/AuthContext";
import { Check, Loader2, AlertCircle, Edit2, X } from "lucide-react";

export default function AttendanceRow({ employee, initialRecord, dateStr }) {
  const { currentUser } = useAuth();

  const [workingHours, setWorkingHours] = useState("");
  const [otHours, setOtHours] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [remarks, setRemarks] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  // Status logs
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Populate existing records if loaded
  useEffect(() => {
    if (initialRecord) {
      setWorkingHours(initialRecord.workingHours !== undefined ? initialRecord.workingHours.toString() : "");
      setOtHours(initialRecord.otHours !== undefined ? initialRecord.otHours.toString() : "");
      setIsHoliday(!!initialRecord.isHoliday);
      setRemarks(initialRecord.remarks || "");
      setIsEditing(false); // Default to view mode if record exists
    } else {
      setWorkingHours("");
      setOtHours("");
      setIsHoliday(false);
      setRemarks("");
      setIsEditing(true); // Default to edit mode if no record
    }
    setSuccess(false);
    setError("");
  }, [initialRecord, dateStr]);

  // Adjust hours if holiday is toggled
  const handleHolidayToggle = (checked) => {
    setIsHoliday(checked);
    if (checked) {
      setWorkingHours("0");
      setOtHours("0");
    } else {
      setWorkingHours("");
      setOtHours("");
    }
  };

  const handleCancel = () => {
    if (initialRecord) {
      setWorkingHours(initialRecord.workingHours !== undefined ? initialRecord.workingHours.toString() : "");
      setOtHours(initialRecord.otHours !== undefined ? initialRecord.otHours.toString() : "");
      setIsHoliday(!!initialRecord.isHoliday);
      setRemarks(initialRecord.remarks || "");
      setIsEditing(false);
      setError("");
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess(false);

    // Validate inputs
    const wh = parseFloat(workingHours);
    const ot = parseFloat(otHours);

    if (workingHours === "" && !isHoliday) {
      setError("Hours required.");
      return;
    }
    if (isNaN(wh) || wh < 0) {
      setError("Cannot be negative.");
      return;
    }
    if (otHours !== "" && (isNaN(ot) || ot < 0)) {
      setError("OT cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      const record = {
        name: employee.name,
        hourRate: employee.hourRate || 0,
        otHourRate: employee.otHourRate || 0,
        workingHours: isHoliday ? 0 : wh,
        otHours: isHoliday ? 0 : (otHours === "" ? 0 : ot),
        isHoliday,
        remarks: remarks.trim()
      };

      await saveAttendanceRecord(employee.uid, dateStr, record, currentUser);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const hrRate = employee.hourRate !== undefined ? parseFloat(employee.hourRate) : 0;
  const otRate = employee.otHourRate !== undefined ? parseFloat(employee.otHourRate) : 0;

  return (
    <tr className="hover:bg-slate-50 transition-colors text-xs font-semibold">
      <td className="py-3 px-6">
        <div>
          <div className="font-bold text-slate-900">{employee.name}</div>
        </div>
      </td>
      <td className="py-3 px-6 text-slate-500 font-medium font-mono">
        ${hrRate.toFixed(2)} / ${otRate.toFixed(2)}
      </td>
      <td className="py-3 px-6 text-slate-700">
        {!isEditing ? (
          <span className="font-bold">{isHoliday ? "-" : workingHours || "-"}</span>
        ) : (
          <input
            type="number"
            disabled={isHoliday}
            placeholder={isHoliday ? "0" : "Hours"}
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none disabled:opacity-50"
          />
        )}
      </td>
      <td className="py-3 px-6 text-slate-700">
        {!isEditing ? (
          <span className="font-bold">{isHoliday ? "-" : otHours || "-"}</span>
        ) : (
          <input
            type="number"
            disabled={isHoliday}
            placeholder={isHoliday ? "0" : "OT"}
            value={otHours}
            onChange={(e) => setOtHours(e.target.value)}
            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none disabled:opacity-50"
          />
        )}
      </td>
      <td className="py-3 px-6 text-center">
        {!isEditing ? (
          <div className="flex justify-center">
            {isHoliday ? (
              <span className="w-5 h-5 bg-[#71d300] text-[#0d2702] rounded-md flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="w-5 h-5 bg-slate-200 rounded-md block"></span>
            )}
          </div>
        ) : (
          <input
            type="checkbox"
            checked={isHoliday}
            onChange={(e) => handleHolidayToggle(e.target.checked)}
            className="w-4 h-4 text-[#71d300] border-slate-300 focus:ring-[#71d300] rounded cursor-pointer"
          />
        )}
      </td>
      <td className="py-3 px-6 text-slate-600">
        {!isEditing ? (
          <span className="truncate block max-w-[150px]">{remarks || "-"}</span>
        ) : (
          <input
            type="text"
            placeholder="Shift details..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
          />
        )}
      </td>
      <td className="py-3 px-6 text-right">
        <div className="flex items-center justify-end gap-2.5">
          {success && (
            <span className="text-emerald-600 flex items-center gap-1 text-[10px] font-bold">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {error && (
            <span className="text-rose-600 flex items-center gap-1 text-[10px] font-bold">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0d2702] font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          ) : (
            <>
              {initialRecord && (
                <button
                  onClick={handleCancel}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-3.5 py-1.5 bg-[#71d300] hover:bg-[#5db300] text-[#0d2702] font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
