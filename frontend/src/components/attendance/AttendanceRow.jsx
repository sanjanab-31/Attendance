import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

// Helper for avatar background colors based on name
const getAvatarColor = (name) => {
  const colors = ["bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700", "bg-purple-100 text-purple-700"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
};

export default function AttendanceRow({ employee, record, onChange }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Safe defaults if record is missing
  const currentRecord = record || {
    status: "Present",
    workingHours: "",
    otHours: "",
    isHoliday: false,
    remarks: ""
  };

  const handleFieldChange = (field, value) => {
    // If holiday is checked, reset hours
    if (field === 'isHoliday') {
      if (value) {
        onChange({ ...currentRecord, [field]: value, workingHours: "0", otHours: "0" });
      } else {
        onChange({ ...currentRecord, [field]: value, workingHours: "", otHours: "" });
      }
    } else {
      onChange({ ...currentRecord, [field]: value });
    }
  };

  const avatarClass = getAvatarColor(employee.name);

  return (
    <tr className="hover:bg-slate-50 transition-colors bg-white text-sm font-semibold border-b border-slate-100 last:border-0 table table-fixed w-full">
      <td className="py-4 px-6 w-[25%]">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarClass}`}>
            {getInitials(employee.name)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{employee.name}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 w-[15%]">
        <div className="relative w-36" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-200 hover:border-[#71d300] focus:border-[#71d300] focus:ring-1 focus:ring-[#71d300] rounded-lg text-sm text-slate-700 outline-none cursor-pointer shadow-sm transition-all"
          >
            <span className="font-semibold flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                currentRecord.status === 'Present' ? 'bg-[#71d300]' : 
                currentRecord.status === 'Absent' ? 'bg-rose-500' : 'bg-amber-400'
              }`}></span>
              {currentRecord.status}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1">
              {['Present', 'Absent', 'Half Day'].map((status) => (
                <button
                  type="button"
                  key={status}
                  className={`w-full text-left px-3 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors ${currentRecord.status === status ? 'bg-slate-50 text-[#0d2702]' : 'text-slate-600'}`}
                  onClick={() => {
                    handleFieldChange('status', status);
                    setDropdownOpen(false);
                  }}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    status === 'Present' ? 'bg-[#71d300]' : 
                    status === 'Absent' ? 'bg-rose-500' : 'bg-amber-400'
                  }`}></span>
                  {status}
                  {currentRecord.status === status && <Check className="w-4 h-4 ml-auto text-[#71d300]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>
      <td className="py-4 px-6 w-[15%]">
        <div className="relative w-24">
          <input
            type="number"
            disabled={currentRecord.isHoliday}
            value={currentRecord.workingHours}
            onChange={(e) => handleFieldChange('workingHours', e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 focus:border-[#71d300] focus:ring-1 focus:ring-[#71d300] hover:border-[#71d300]/50 rounded-lg text-sm outline-none disabled:opacity-50 disabled:bg-slate-50 shadow-sm transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">h</span>
        </div>
      </td>
      <td className="py-4 px-6 w-[15%]">
        <div className={`relative w-24 ${currentRecord.otHours > 0 ? 'ring-1 ring-[#71d300] rounded-lg' : ''}`}>
          <input
            type="number"
            disabled={currentRecord.isHoliday}
            value={currentRecord.otHours}
            onChange={(e) => handleFieldChange('otHours', e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 focus:border-[#71d300] focus:ring-1 focus:ring-[#71d300] hover:border-[#71d300]/50 rounded-lg text-sm outline-none disabled:opacity-50 disabled:bg-slate-50 shadow-sm transition-colors"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">h</span>
        </div>
      </td>
      <td className="py-4 px-6 w-[10%]">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={currentRecord.isHoliday}
            onChange={(e) => handleFieldChange('isHoliday', e.target.checked)}
          />
          <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#71d300]"></div>
        </label>
      </td>
      <td className="py-4 px-6 w-[20%]">
        <input
          type="text"
          placeholder="Add note..."
          value={currentRecord.remarks}
          onChange={(e) => handleFieldChange('remarks', e.target.value)}
          className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-[#71d300] focus:ring-1 focus:ring-[#71d300] hover:border-[#71d300]/50 rounded-lg text-sm outline-none shadow-sm placeholder:text-slate-400 placeholder:font-normal transition-colors"
        />
      </td>
    </tr>
  );
}
