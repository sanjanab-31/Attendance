const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/Reports.jsx', 'utf8');

// 1. Remove date presets from top
content = content.replace(/<div>\s*<label className="text-\[9px\] font-bold text-slate-400 uppercase tracking-wider block mb-1">Timeframe Presets<\/label>[\s\S]*?<\/select>\s*<\/div>/, '');
content = content.replace(/\{datePreset === "custom" && \(\s*<div>\s*<label className="text-\[9px\] font-bold text-slate-400 uppercase tracking-wider block mb-1">Start Date<\/label>[\s\S]*?<\/div>\s*\)\}/g, '');
content = content.replace(/\{datePreset === "custom" && \(\s*<div>\s*<label className="text-\[9px\] font-bold text-slate-400 uppercase tracking-wider block mb-1">End Date<\/label>[\s\S]*?<\/div>\s*\)\}/g, '');

// 2. Add Date Presets near Search Bar
const dateHtml = \
              {/* Date Filters */}
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none min-w-[140px]"
              >
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              {datePreset === "custom" && (
                <>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none" />
                </>
              )}
\;
content = content.replace('{/* Export Actions dropdown/buttons */}', dateHtml + '\n              {/* Export Actions dropdown/buttons */}');

// 3. Make table scrollable
content = content.replace('<div className="overflow-x-auto print:overflow-visible">', '<div className="overflow-auto max-h-[60vh] thin-scrollbar relative print:overflow-visible print:max-h-none">');

// Replace paginatedData -> finalReportData
content = content.replace(/\(window\.matchMedia\("print"\)\.matches \? finalReportData : paginatedData\)\.map/g, 'finalReportData.map');

// 4. Sticky headers
content = content.replace(/<tr className="bg-slate-50 border-b border-slate-200/g, '<tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm');

// 5. Remove pagination footer
content = content.replace(/\{\/\* Pagination Footer \(hidden on print\) \*\/\}(.|\n)*?\{totalEntries > 0 && \((.|\n)*?<\/div>\s*\)\s*\}/g, '');

fs.writeFileSync('src/pages/owner/Reports.jsx', content);
console.log('done');
