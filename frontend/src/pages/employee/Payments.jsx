import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeToEmployeeAttendance,
  subscribeToEmployeePayments,
  subscribeToEmployeeAdvances
} from "../../services/employeePortalService";
import { DollarSign, Coins, Info, Download, Search } from "lucide-react";

export default function EmployeePayments() {
  const { currentUser } = useAuth();
  
  // Real-time Firestore records states
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerPreset, setLedgerPreset] = useState("all"); // "all", "today", "thisWeek", "thisMonth", "thisYear", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);

    const uid = currentUser.uid;

    // Set up real-time stream listeners via employeePortalService
    const unsubscribeAttendance = subscribeToEmployeeAttendance(
      uid,
      (data) => setAttendance(data),
      (err) => console.error(err)
    );

    const unsubscribePayments = subscribeToEmployeePayments(
      uid,
      (data) => setPayments(data),
      (err) => console.error(err)
    );

    const unsubscribeAdvances = subscribeToEmployeeAdvances(
      uid,
      (data) => {
        setAdvances(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAttendance();
      unsubscribePayments();
      unsubscribeAdvances();
    };
  }, [currentUser]);

  // Combined Chronological Transaction Timeline Calculations
  const getTimelineData = () => {
    const list = [];

    // Add attendance daily earnings
    attendance.forEach((log) => {
      list.push({
        id: `att_${log.date}`,
        date: log.date,
        type: "Earnings",
        change: parseFloat(log.earnings) || 0,
        details: log.isHoliday ? "Holiday Roster" : `Worked: ${log.workingHours} hrs, OT: ${log.otHours} hrs`,
        remarks: log.remarks || "-"
      });
    });

    // Add payouts
    payments.forEach((pay) => {
      list.push({
        id: `pay_${pay.id || pay.date}`,
        date: pay.date,
        type: "Payment",
        change: -(parseFloat(pay.amount) || 0),
        details: `Salary Payout via ${pay.method}`,
        remarks: pay.remarks || "-"
      });
    });

    // Add advances
    advances.forEach((adv) => {
      list.push({
        id: `adv_${adv.id || adv.date}`,
        date: adv.date,
        type: "Advance",
        change: -(parseFloat(adv.amount) || 0),
        details: `Salary Advance via ${adv.method}`,
        remarks: adv.remarks || "-"
      });
    });

    // Sort ascending to resolve running balance correctly
    list.sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = 0;
    const computed = list.map((item) => {
      runningBalance += item.change;
      return {
        ...item,
        balance: runningBalance
      };
    });

    return computed.reverse(); // newest first for display
  };

  const timeline = getTimelineData();

  // Apply filters
  const filteredTimeline = timeline.filter((item) => {
    // 1. Text Search matching
    const matchesSearch =
      item.remarks.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.details.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.date.includes(ledgerSearch);

    // 2. Preset filters
    const today = new Date();
    let limitDateStr = "";

    if (ledgerPreset === "today") {
      limitDateStr = today.toISOString().split("T")[0];
    } else if (ledgerPreset === "thisWeek") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      limitDateStr = oneWeekAgo.toISOString().split("T")[0];
    } else if (ledgerPreset === "thisMonth") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(today.getDate() - 30);
      limitDateStr = oneMonthAgo.toISOString().split("T")[0];
    } else if (ledgerPreset === "thisYear") {
      const oneYearAgo = new Date();
      oneYearAgo.setDate(today.getDate() - 365);
      limitDateStr = oneYearAgo.toISOString().split("T")[0];
    }

    let matchesPreset = true;
    if (ledgerPreset === "custom") {
      if (startDate && item.date < startDate) matchesPreset = false;
      if (endDate && item.date > endDate) matchesPreset = false;
    } else if (limitDateStr) {
      matchesPreset = item.date >= limitDateStr && item.date <= today.toISOString().split("T")[0];
    }

    return matchesSearch && matchesPreset;
  });

  // Export / Download Slip File
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Transaction Type,Details,Amount Change,Running Balance,Remarks\n";
    
    filteredTimeline.forEach((item) => {
      const changeSign = item.change >= 0 ? `+$${item.change.toFixed(2)}` : `-$${Math.abs(item.change).toFixed(2)}`;
      csvContent += `"${item.date}","${item.type}","${item.details}","${changeSign}","$${item.balance.toFixed(2)}","${item.remarks}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payslip_${currentUser?.name}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
        <div className="h-52 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  // Live running sums
  const totalEarned = attendance.reduce((sum, a) => sum + (parseFloat(a.earnings) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalAdvance = advances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  
  const pendingSalary = totalEarned - totalPaid;
  const finalPayable = pendingSalary - totalAdvance;

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0d2702] flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-[#0d2702]" />
            My Ledger & Financial History
          </h1>
          <p className="text-slate-500 mt-0.5 text-xs font-semibold">
            Detailed chronological record of your wages, payments received, and advance deductions.
          </p>
        </div>

        {/* Download Slip */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0d2702] hover:bg-[#163c03] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Download Wage Slip
        </button>
      </div>

      {/* Salary Overview Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Salary Earned</div>
          <div className="text-lg font-extrabold text-slate-700 mt-0.5">${totalEarned.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Salary Paid</div>
          <div className="text-lg font-extrabold text-slate-700 mt-0.5">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Pending Salary</div>
          <div className="text-lg font-extrabold text-slate-700 mt-0.5">${pendingSalary.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Advance Deduction</div>
          <div className="text-lg font-extrabold text-slate-700 mt-0.5">${totalAdvance.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Final Payable Salary</div>
          <div className={`text-lg font-extrabold mt-0.5 ${finalPayable >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ${finalPayable.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Unified Timeline Ledger */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-[#0d2702] uppercase tracking-wider">
            Combined Transaction Timeline
          </h3>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none w-40"
              />
            </div>

            <select
              value={ledgerPreset}
              onChange={(e) => setLedgerPreset(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#71d300]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {ledgerPreset === "custom" && (
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

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          {filteredTimeline.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold text-center py-6">No transaction logs match search constraints.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-4">Amount Change</th>
                  <th className="py-2.5 px-4">Running Balance</th>
                  <th className="py-2.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredTimeline.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        item.type === "Earnings"
                          ? "bg-[#71d300]/15 text-[#0d2702] border border-[#71d300]/25"
                          : item.type === "Payment"
                          ? "bg-slate-100 text-slate-700 border border-slate-200"
                          : "bg-amber-50 text-amber-800 border border-amber-100"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">{item.details}</td>
                    <td className={`py-3 px-4 font-extrabold ${item.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {item.change >= 0 ? `+$${item.change.toFixed(2)}` : `-$${Math.abs(item.change).toFixed(2)}`}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">${item.balance.toFixed(2)}</td>
                    <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate">{item.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
