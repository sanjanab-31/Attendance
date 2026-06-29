import React from "react";

export default function DatePicker({
  label,
  name,
  value,
  onChange,
  error,
  required = false
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-slate-900 outline-none text-xs transition-colors ${
          error ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-[#71d300]"
        }`}
      />
      {error && (
        <p className="text-rose-600 text-[10px] mt-1 font-semibold">{error}</p>
      )}
    </div>
  );
}
