import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import {
  FileText,
  Calendar,
  IndianRupee,
  TrendingUp,
  CreditCard,
  Coins,
  Users,
  Filter,
  Download,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Printer,
  BarChart3,
  Award,
  Activity,
  Clock,
  ChevronDown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// Import Reusable Summary Card
import SummaryCard from "../../components/SummaryCard";

export default function Reports() {
  const { currentUser } = useAuth();
  
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Owner company name metadata
  const [companyName, setCompanyName] = useState("ESA Attendance");

  // Global Filters
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [datePreset, setDatePreset] = useState("thisMonth"); 
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Report Specific States
  const [activeReport, setActiveReport] = useState("analytics"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date"); 
  const [sortOrder, setSortOrder] = useState("desc"); 
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Set up real-time onSnapshot listeners to automatically update whenever Firestore data changes
    const unsubEmployees = onSnapshot(
      query(collection(db, "users"), where("role", "==", "employee")),
      (snap) => {
        setEmployees(snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() })));
      }
    );

    const unsubAttendance = onSnapshot(collection(db, "attendance"), (snap) => {
      setAttendance(snap.docs.map((doc) => doc.data()));
    });

    const unsubPayments = onSnapshot(collection(db, "payments"), (snap) => {
      setPayments(snap.docs.map((doc) => doc.data()));
    });

    const unsubAdvances = onSnapshot(collection(db, "advances"), (snap) => {
      setAdvances(snap.docs.map((doc) => doc.data()));
      setLoading(false);
    });

    // Retrieve Owner Company Name if set
    if (currentUser?.uid) {
      getDoc(doc(db, "users", currentUser.uid)).then((ownerSnap) => {
        if (ownerSnap.exists()) {
          setCompanyName(ownerSnap.data().companyName || "ESA Attendance");
        }
      });
    }

    return () => {
      unsubEmployees();
      unsubAttendance();
      unsubPayments();
      unsubAdvances();
    };
  }, [currentUser]);

  // Reset pagination & search when swapping reports
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm("");
    if (activeReport === "attendance" || activeReport === "payment" || activeReport === "advance") {
      setSortBy("date");
      setSortOrder("desc");
    } else {
      setSortBy("name");
      setSortOrder("asc");
    }
  }, [activeReport]);

  // Filter datasets helper
  const getFilteredData = () => {
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

    const filterByEmployeeAndDate = (list) => {
      return list.filter((item) => {
        const matchesEmployee = selectedEmployee === "all" ? true : item.uid === selectedEmployee;
        
        let matchesDate = true;
        const targetDate = item.date || item.effectiveDate || item.dateOfJoining || "";
        
        if (datePreset === "custom") {
          if (startDate && targetDate < startDate) matchesDate = false;
          if (endDate && targetDate > endDate) matchesDate = false;
        } else if (limitDateStr) {
          matchesDate = targetDate >= limitDateStr && targetDate <= today.toISOString().split("T")[0];
        }

        return matchesEmployee && matchesDate;
      });
    };

    return {
      filteredAttendance: filterByEmployeeAndDate(attendance),
      filteredPayments: filterByEmployeeAndDate(payments),
      filteredAdvances: filterByEmployeeAndDate(advances),
      filteredEmployees: employees.filter(emp => selectedEmployee === "all" ? true : emp.uid === selectedEmployee)
    };
  };

  const { filteredAttendance, filteredPayments, filteredAdvances, filteredEmployees } = getFilteredData();

  const totalEmployees = filteredEmployees.length;
  const totalWorkingHours = filteredAttendance.reduce((sum, a) => sum + (parseFloat(a.workingHours) || 0), 0);
  const totalOTHours = filteredAttendance.reduce((sum, a) => sum + (parseFloat(a.otHours) || 0), 0);
  const totalSalaryEarned = filteredAttendance.reduce((sum, a) => sum + (parseFloat(a.earnings) || 0), 0);
  const totalSalaryPaid = filteredPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalAdvanceGiven = filteredAdvances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const totalPendingSalary = totalSalaryEarned - totalSalaryPaid - totalAdvanceGiven;

  // Analytics Helpers
  const getMostActiveEmployees = () => {
    const list = filteredEmployees.map((e) => {
      const logs = filteredAttendance.filter((a) => a.uid === e.uid);
      const days = logs.filter((a) => !a.isHoliday && (a.workingHours > 0 || a.otHours > 0)).length;
      const hours = logs.reduce((sum, a) => sum + (parseFloat(a.workingHours) || 0), 0);
      const ot = logs.reduce((sum, a) => sum + (parseFloat(a.otHours) || 0), 0);
      return { name: e.name, days, hours, ot };
    });

    return {
      byDays: [...list].sort((a, b) => b.days - a.days).slice(0, 5),
      byHours: [...list].sort((a, b) => b.hours - a.hours).slice(0, 5),
      byOt: [...list].sort((a, b) => b.ot - a.ot).slice(0, 5)
    };
  };

  const { byDays: activeByDays, byHours: activeByHours, byOt: activeByOt } = getMostActiveEmployees();

  // Sorting & Filtering processing
  const processReportData = () => {
    let dataset = [];

    if (activeReport === "attendance") {
      dataset = filteredAttendance.map((a) => ({
        date: a.date,
        name: a.name,
        workingHours: parseFloat(a.workingHours) || 0,
        otHours: parseFloat(a.otHours) || 0,
        isHoliday: !!a.isHoliday,
        remarks: a.remarks || "-"
      }));
    } else if (activeReport === "salary") {
      filteredEmployees.forEach((e) => {
        const empAtt = filteredAttendance.filter((a) => a.uid === e.uid);
        const earned = empAtt.reduce((sum, a) => sum + (parseFloat(a.earnings) || 0), 0);
        const paid = filteredPayments.filter((p) => p.uid === e.uid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const advance = filteredAdvances.filter((a) => a.uid === e.uid).reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
        
        dataset.push({
          name: e.name,
          earned,
          paid,
          remaining: earned - paid,
          payable: earned - paid - advance
        });
      });
    } else if (activeReport === "payment") {
      dataset = filteredPayments.map((p) => ({
        date: p.date,
        name: p.name,
        amount: parseFloat(p.amount) || 0,
        method: p.method,
        remarks: p.remarks || "-"
      }));
    } else if (activeReport === "advance") {
      dataset = filteredAdvances.map((a) => ({
        date: a.date,
        name: a.name,
        amount: parseFloat(a.amount) || 0,
        method: a.method || "Cash",
        remarks: a.remarks || "-"
      }));
    } else if (activeReport === "employee") {
      filteredEmployees.forEach((e) => {
        const empAtt = filteredAttendance.filter((a) => a.uid === e.uid);
        const days = empAtt.filter((a) => !a.isHoliday && (a.workingHours > 0 || a.otHours > 0)).length;
        const hours = empAtt.reduce((sum, a) => sum + (parseFloat(a.workingHours) || 0), 0);
        const ot = empAtt.reduce((sum, a) => sum + (parseFloat(a.otHours) || 0), 0);
        const earned = empAtt.reduce((sum, a) => sum + (parseFloat(a.earnings) || 0), 0);

        dataset.push({
          name: e.name,
          phone: e.phone,
          email: e.email,
          dateOfJoining: e.dateOfJoining,
          days,
          hours,
          ot,
          earned
        });
      });
    } else if (activeReport === "payroll") {
      filteredEmployees.forEach((e) => {
        const empAtt = filteredAttendance.filter((a) => a.uid === e.uid);
        const empPay = filteredPayments.filter((p) => p.uid === e.uid);
        const empAdv = filteredAdvances.filter((a) => a.uid === e.uid);

        const earned = empAtt.reduce((sum, a) => sum + (parseFloat(a.earnings) || 0), 0);
        const paid = empPay.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const advance = empAdv.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

        dataset.push({
          name: e.name,
          earned,
          paid,
          pending: earned - paid,
          advance,
          net: earned - paid - advance
        });
      });
    }

    const searched = dataset.filter((row) => {
      const vals = Object.values(row).map((v) => String(v).toLowerCase());
      return vals.some((v) => v.includes(searchTerm.toLowerCase()));
    });

    searched.sort((a, b) => {
      let valA = a[sortBy] !== undefined ? a[sortBy] : "";
      let valB = b[sortBy] !== undefined ? b[sortBy] : "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return searched;
  };

  const finalReportData = processReportData();

  // Pagination
  const totalEntries = finalReportData.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = finalReportData.slice(startIndex, startIndex + pageSize);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Structured Export Content generator
  const getHeaderMetadata = (formatName) => {
    const range = datePreset === "custom" ? `${startDate} to ${endDate}` : datePreset;
    return (
      `Company Name: ${companyName}\n` +
      `Report Name: ${activeReport.toUpperCase()} Report\n` +
      `Generated Date: ${new Date().toLocaleDateString()}\n` +
      `Date Range: ${range}\n` +
      `Total Records: ${totalEntries}\n` +
      `Format: ${formatName}\n\n`
    );
  };

  const getFooterMetadata = () => {
    return (
      `\nGenerated By: ${currentUser?.name || "Owner"}\n` +
      `System Generated Report\n`
    );
  };

  const handleExport = (format) => {
    let csvContent = "";
    
    if (format === "CSV" || format === "EXCEL") {
      csvContent += getHeaderMetadata(format);
    }

    if (activeReport === "attendance") {
      csvContent += "Date,Employee Name,Working Hours,OT Hours,Holiday,Remarks\n";
      finalReportData.forEach((a) => {
        csvContent += `"${a.date}","${a.name}","${a.workingHours}","${a.otHours}","${a.isHoliday ? "Yes" : "No"}","${a.remarks || ""}"\n`;
      });
    } else if (activeReport === "salary") {
      csvContent += "Employee Name,Salary Earned,Salary Paid,Remaining Salary,Final Payable\n";
      finalReportData.forEach((s) => {
        csvContent += `"${s.name}","₹${s.earned.toFixed(2)}","₹${s.paid.toFixed(2)}","₹${s.remaining.toFixed(2)}","₹${s.payable.toFixed(2)}"\n`;
      });
    } else if (activeReport === "payment") {
      csvContent += "Payment Date,Employee Name,Amount,Payment Method,Remarks\n";
      finalReportData.forEach((p) => {
        csvContent += `"${p.date}","${p.name}","₹${p.amount.toFixed(2)}","${p.method}","${p.remarks || ""}"\n`;
      });
    } else if (activeReport === "advance") {
      csvContent += "Advance Date,Employee Name,Amount,Payment Method,Remarks\n";
      finalReportData.forEach((a) => {
        csvContent += `"${a.date}","${a.name}","₹${a.amount.toFixed(2)}","${a.method}","${a.remarks || ""}"\n`;
      });
    } else if (activeReport === "employee") {
      csvContent += "Employee Name,Total Working Days,Total Hours,Total OT Hours,Total Earned\n";
      finalReportData.forEach((e) => {
        csvContent += `"${e.name}","${e.days}","${e.hours}","${e.ot}","₹${e.earned.toFixed(2)}"\n`;
      });
    } else if (activeReport === "payroll") {
      csvContent += "Employee Name,Salary Earned,Salary Paid,Pending Salary,Advance Adjustments,Net Payable\n";
      finalReportData.forEach((p) => {
        csvContent += `"${p.name}","₹${p.earned.toFixed(2)}","₹${p.paid.toFixed(2)}","₹${p.pending.toFixed(2)}","₹${p.advance.toFixed(2)}","₹${p.net.toFixed(2)}"\n`;
      });
    }

    if (format === "CSV" || format === "EXCEL") {
      csvContent += getFooterMetadata();
    }

    const mime = format === "EXCEL" ? "application/vnd.ms-excel" : "text/csv;charset=utf-8,";
    const ext = format === "EXCEL" ? "xls" : "csv";

    const encodedUri = encodeURI(`data:${mime}${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeReport}_report_${new Date().toISOString().split("T")[0]}.${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 rounded-lg"></div>
          <div className="h-24 bg-slate-200 rounded-lg"></div>
          <div className="h-24 bg-slate-200 rounded-lg"></div>
          <div className="h-24 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-52 bg-slate-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 text-slate-800 font-sans print:bg-white print:p-0 overflow-hidden">
      {/* Print-Only Header Block */}
      <div className="hidden print:block border-b-2 border-slate-300 pb-5 mb-5">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-primary-dark">{companyName}</h1>
        <h2 className="text-lg font-bold text-slate-700 capitalize mt-1">{activeReport} Roster Report</h2>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-semibold mt-4">
          <div>Generated Date: {new Date().toLocaleDateString()}</div>
          <div>Report Timeframe: {datePreset === "custom" ? `${startDate} to ${endDate}` : datePreset}</div>
          <div>Generated By: {currentUser?.name}</div>
          <div>Total Records Captured: {totalEntries}</div>
        </div>
      </div>

      {/* Standard UI Layout (hidden on print) */}
      <div className="print:hidden flex flex-col gap-6 flex-1 min-h-0 overflow-hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-dark">Reports & Analytics</h1>
          <p className="text-slate-500 mt-0.5 text-xs font-semibold">
            Centralized business overview. Generate attendance, salary audits, and financial summaries.
          </p>
        </div>





        {/* Report Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-slate-200 pb-4 mb-4">
          {[
            { id: "analytics", label: "Analytics Section", icon: BarChart3 },
            { id: "attendance", label: "Attendance Report", icon: Calendar },
            { id: "salary", label: "Salary Report", icon: TrendingUp },
            { id: "payment", label: "Payment Report", icon: CreditCard },
            { id: "advance", label: "Advance Report", icon: Coins },
            { id: "employee", label: "Employee Report", icon: Users },
            { id: "payroll", label: "Payroll Summary", icon: FileText }
          ].map((report) => {
            const Icon = report.icon;
            const isActive = activeReport === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-colors shadow-sm ${
                  isActive
                    ? "bg-primary text-primary-dark"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {/* <Icon className={`w-4 h-4 ${isActive ? "text-primary-dark" : "text-slate-400"}`} /> */}
                {report.label}
              </button>
            );
          })}
        </div>

      {/* Analytics Dashboard Visual Panels */}
      {activeReport === "analytics" && (
        <div className="flex-1 overflow-y-auto thin-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden pb-6">
          
          {/* Panel 1: Working Hours & OT Allocation */}
          <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="w-4.5 h-4.5 text-primary" /> Working Hours Analytics
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regular Hours</div>
                <div className="text-base font-extrabold text-primary-dark mt-1">{totalWorkingHours} hrs</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overtime Hours</div>
                <div className="text-base font-extrabold text-amber-600 mt-1">{totalOTHours} hrs</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Shift</div>
                <div className="text-base font-extrabold text-slate-700 mt-1">
                  {totalEntries > 0 ? (totalWorkingHours / totalEntries).toFixed(1) : "0"} hrs
                </div>
              </div>
            </div>
            {/* Visual ratio bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Roster Hours vs OT Allocation</span>
                <span>{totalWorkingHours + totalOTHours} Total hrs</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-primary"
                  style={{ width: `${(totalWorkingHours / (totalWorkingHours + totalOTHours || 1)) * 100}%` }}
                ></div>
                <div
                  className="bg-amber-500"
                  style={{ width: `${(totalOTHours / (totalWorkingHours + totalOTHours || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary"></span> Regular Hours</div>
                <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Overtime Hours</div>
              </div>
            </div>
          </div>

          {/* Panel 2: Payroll Financial Summary Bar Charts */}
          <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-slate-100 pb-2">
              <IndianRupee className="w-4.5 h-4.5 text-primary" /> Payroll Financial Breakdown
            </h3>
            <div className="space-y-3">
              {[
                { label: "Salary Earned", amount: totalSalaryEarned, color: "bg-slate-700" },
                { label: "Salary Paid", amount: totalSalaryPaid, color: "bg-primary" },
                { label: "Pending Outstanding", amount: totalPendingSalary, color: "bg-rose-500" },
                { label: "Advances Given", amount: totalAdvanceGiven, color: "bg-amber-500" }
              ].map((item, index) => {
                const maxVal = Math.max(totalSalaryEarned, 1);
                const pct = Math.min((item.amount / maxVal) * 100, 100);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>{item.label}</span>
                      <span>₹{item.amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel 3: Most Active Employees Leaderboard */}
          <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-slate-100 pb-2">
              <Award className="w-4.5 h-4.5 text-primary" /> Leaderboard: Days Worked
            </h3>
            <div className="space-y-3">
              {activeByDays.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-6">No entries compiled.</p>
              ) : (
                activeByDays.map((item, index) => {
                  const maxDays = Math.max(...activeByDays.map((d) => d.days), 1);
                  const pct = (item.days / maxDays) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>{index + 1}. {item.name}</span>
                        <span>{item.days} active days</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 border border-slate-150 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel 4: Hours Allocation Leaders */}
          <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-slate-100 pb-2">
              <Activity className="w-4.5 h-4.5 text-primary" /> Leaders: Total Shift Hours
            </h3>
            <div className="space-y-3">
              {activeByHours.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold text-center py-6">No hours compiled.</p>
              ) : (
                activeByHours.map((item, index) => {
                  const maxHours = Math.max(...activeByHours.map((h) => h.hours), 1);
                  const pct = (item.hours / maxHours) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>{index + 1}. {item.name}</span>
                        <span>{item.hours.toFixed(1)} hrs worked</span>
                      </div>
                      <div className="w-full h-2 bg-slate-50 border border-slate-150 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-700 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* Data Table Area (hidden when Analytics tab is selected) */}
      {activeReport !== "analytics" && (
        <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-lg p-6 shadow-sm gap-4 print:border-0 print:p-0 print:shadow-none">
          
          {/* Title, Search & Export Actions Row (hidden on print) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-3 print:hidden">
            <h2 className="text-sm font-bold text-primary-dark uppercase tracking-wider">
              {activeReport} Dataset Roster
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-semibold text-slate-700 outline-none w-52 shadow-sm transition-colors hover:border-slate-300"
                />
              </div>

              {/* Date Filter */}
              <div className="relative flex items-center">
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-semibold text-slate-700 outline-none w-36 shadow-sm transition-colors hover:border-slate-300 cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="thisYear">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              
              {datePreset === "custom" && (
                <>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-semibold text-slate-700 outline-none shadow-sm transition-colors hover:border-slate-300"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-semibold text-slate-700 outline-none shadow-sm transition-colors hover:border-slate-300"
                  />
                </>
              )}
              
              {/* Export Actions dropdown/buttons */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-dark hover:bg-primary text-white hover:text-primary-dark text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-transparent shadow-sm"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                    <button onClick={() => { handleExport("CSV"); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors">Export CSV</button>
                    <button onClick={() => { handleExport("EXCEL"); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors">Export Excel</button>
                    <button onClick={() => { handlePrintPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors">Print PDF</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Tables */}
          <div className="flex-1 overflow-auto thin-scrollbar relative print:overflow-visible print:max-h-none">
            {finalReportData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6 font-semibold">No report records found matching parameters.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse print:text-[11px]">
                <thead>
                  {activeReport === "attendance" && (
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-wider cursor-pointer sticky top-0 z-10 shadow-sm">
                      <th className="py-2.5 px-4" onClick={() => toggleSort("date")}>Date <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4" onClick={() => toggleSort("name")}>Employee <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-center" onClick={() => toggleSort("workingHours")}>Working Hours <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-center" onClick={() => toggleSort("otHours")}>OT Hours <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-center">Holiday</th>
                      <th className="py-2.5 px-4">Remarks</th>
                    </tr>
                  )}
                  {activeReport === "salary" && (
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-wider cursor-pointer sticky top-0 z-10 shadow-sm">
                      <th className="py-2.5 px-4" onClick={() => toggleSort("name")}>Employee Name <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("earned")}>Salary Earned <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("paid")}>Salary Paid <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("remaining")}>Remaining Salary <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("payable")}>Final Payable <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                    </tr>
                  )}
                  {activeReport === "payment" && (
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-wider cursor-pointer sticky top-0 z-10 shadow-sm">
                      <th className="py-2.5 px-4" onClick={() => toggleSort("date")}>Payment Date <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4" onClick={() => toggleSort("name")}>Employee <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("amount")}>Amount <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4" onClick={() => toggleSort("method")}>Payment Method <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4">Remarks</th>
                    </tr>
                  )}
                  {activeReport === "advance" && (
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-wider cursor-pointer sticky top-0 z-10 shadow-sm">
                      <th className="py-2.5 px-4" onClick={() => toggleSort("date")}>Advance Date <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4" onClick={() => toggleSort("name")}>Employee <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("amount")}>Amount <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4" onClick={() => toggleSort("method")}>Payment Method <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4">Remarks</th>
                    </tr>
                  )}
                  {activeReport === "employee" && (
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-wider cursor-pointer sticky top-0 z-10 shadow-sm">
                      <th className="py-2.5 px-4" onClick={() => toggleSort("name")}>Employee <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-center" onClick={() => toggleSort("days")}>Total Working Days <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-center" onClick={() => toggleSort("hours")}>Total Hours <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-center" onClick={() => toggleSort("ot")}>Total OT Hours <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("earned")}>Total Salary Earned <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                    </tr>
                  )}
                  {activeReport === "payroll" && (
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold tracking-wider cursor-pointer sticky top-0 z-10 shadow-sm">
                      <th className="py-2.5 px-4" onClick={() => toggleSort("name")}>Employee Name <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("earned")}>Salary Earned <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("paid")}>Salary Paid <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("pending")}>Pending Salary <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("advance")}>Advance Adjustments <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                      <th className="py-2.5 px-4 text-right" onClick={() => toggleSort("net")}>Net Payable <ArrowUpDown className="w-3 h-3 inline ml-1 print:hidden" /></th>
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 print:text-black">
                  {activeReport === "attendance" &&
                    finalReportData.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-bold text-slate-900">{a.date}</td>
                        <td className="py-2 px-4 text-slate-900 font-bold">{a.name}</td>
                        <td className="py-2 px-4 text-center">{a.isHoliday ? "-" : a.workingHours}</td>
                        <td className="py-2 px-4 text-center">{a.isHoliday ? "-" : a.otHours}</td>
                        <td className="py-2 px-4 text-center">{a.isHoliday ? "Yes" : "No"}</td>
                        <td className="py-2 px-4 text-slate-400 italic">{a.remarks}</td>
                      </tr>
                    ))}

                  {activeReport === "salary" &&
                    finalReportData.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 text-slate-900 font-bold">{s.name}</td>
                        <td className="py-2 px-4 text-right font-mono">₹{s.earned.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right font-mono">₹{s.paid.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right font-mono">₹{s.remaining.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right font-mono text-primary-dark font-bold">₹{s.payable.toFixed(2)}</td>
                      </tr>
                    ))}

                  {activeReport === "payment" &&
                    finalReportData.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-bold text-slate-900">{p.date}</td>
                        <td className="py-2 px-4 text-slate-900 font-bold">{p.name}</td>
                        <td className="py-2 px-4 text-right text-primary-dark font-extrabold font-mono">₹{p.amount.toFixed(2)}</td>
                        <td className="py-2 px-4">{p.method}</td>
                        <td className="py-2 px-4 text-slate-400 italic">{p.remarks}</td>
                      </tr>
                    ))}

                  {activeReport === "advance" &&
                    finalReportData.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-bold text-slate-900">{a.date}</td>
                        <td className="py-2 px-4 text-slate-900 font-bold">{a.name}</td>
                        <td className="py-2 px-4 text-right text-amber-600 font-extrabold font-mono">₹{a.amount.toFixed(2)}</td>
                        <td className="py-2 px-4">{a.method}</td>
                        <td className="py-2 px-4 text-slate-400 italic">{a.remarks}</td>
                      </tr>
                    ))}

                  {activeReport === "employee" &&
                    finalReportData.map((e, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 text-slate-900 font-bold">{e.name}</td>
                        <td className="py-2 px-4 text-center">{e.days} days</td>
                        <td className="py-2 px-4 text-center">{e.hours} hrs</td>
                        <td className="py-2 px-4 text-center">{e.ot} hrs</td>
                        <td className="py-2 px-4 text-right font-mono text-primary-dark font-bold">₹{e.earned.toFixed(2)}</td>
                      </tr>
                    ))}

                  {activeReport === "payroll" &&
                    finalReportData.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 text-slate-900 font-bold">{p.name}</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500">₹{p.earned.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right font-mono text-emerald-600">₹{p.paid.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right font-mono text-amber-600">₹{p.pending.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right font-mono text-rose-500">₹{p.advance.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right font-mono font-extrabold text-primary-dark bg-primary/10">₹{p.net.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Print-Only Footer Block */}
          <div className="hidden print:block border-t border-slate-300 pt-4 mt-6 text-[10px] text-slate-400 font-semibold text-right">
            Report Generated by Owner. System Generated Document.
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
