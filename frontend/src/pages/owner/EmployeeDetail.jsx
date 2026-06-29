import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, getDocs } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  getEmployeeById,
  updateEmployee,
  resetEmployeePassword,
  updateEmployeeRates
} from "../../services/employeeService";
import {
  getAttendanceByEmployee,
  calculateAttendanceSummary
} from "../../services/attendanceService";
import {
  calculateEmployeeSalarySummary
} from "../../services/payroll";
import {
  getPaymentsForEmployee,
  logSalaryPayment
} from "../../services/paymentService";
import {
  getAdvancesForEmployee,
  logSalaryAdvance
} from "../../services/advanceService";
import {
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  History,
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Coins,
  CreditCard,
  BookOpen,
  Filter,
  Search,
  Download
} from "lucide-react";

// Import Reusable Form Components
import Input from "../../components/employee/Input";
import DatePicker from "../../components/employee/DatePicker";

export default function EmployeeDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalDaysWorked: 0,
    totalHolidays: 0,
    totalHoursWorked: 0,
    totalOTHours: 0
  });

  // Financial summary states
  const [financials, setFinancials] = useState({
    totalEarned: 0,
    totalPaid: 0,
    totalAdvance: 0,
    pendingSalary: 0,
    finalPayable: 0
  });

  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const [advancesHistory, setAdvancesHistory] = useState([]);
  const [rawAttendanceLogs, setRawAttendanceLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile"); // "profile", "rates", "payments", "advances", "ledger"

  // Ledger Filter States
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("all");
  const [ledgerStartDate, setLedgerStartDate] = useState("");
  const [ledgerEndDate, setLedgerEndDate] = useState("");

  // Forms State
  const [editProfile, setEditProfile] = useState({ name: "", age: "", phone: "", address: "" });
  const [tempPassword, setTempPassword] = useState("");
  const [rateForm, setRateForm] = useState({ hourRate: "", otHourRate: "", effectiveDate: new Date().toISOString().split("T")[0] });
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "Cash", date: new Date().toISOString().split("T")[0], remarks: "" });
  const [advanceForm, setAdvanceForm] = useState({ amount: "", method: "Cash", date: new Date().toISOString().split("T")[0], remarks: "" });

  // Notifications
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  const [passErrors, setPassErrors] = useState({});
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const [rateErrors, setRateErrors] = useState({});
  const [rateSuccess, setRateSuccess] = useState("");
  const [rateLoading, setRateLoading] = useState(false);

  const [payErrors, setPayErrors] = useState({});
  const [paySuccess, setPaySuccess] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const [advErrors, setAdvErrors] = useState({});
  const [advSuccess, setAdvSuccess] = useState("");
  const [advLoading, setAdvLoading] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch employee details
      const empData = await getEmployeeById(uid);
      setEmployee(empData);
      setEditProfile({
        name: empData.name || "",
        age: empData.age || "",
        phone: empData.phone || "",
        address: empData.address || ""
      });

      // 2. Fetch rate history
      const ratesRef = collection(db, "users", uid, "rateHistory");
      const ratesSnap = await getDocs(ratesRef);
      const ratesList = ratesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      ratesList.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
      setRateHistory(ratesList);

      // 3. Fetch logs and logs summary
      const logs = await getAttendanceByEmployee(uid);
      setRawAttendanceLogs(logs);
      const summary = calculateAttendanceSummary(logs);
      setAttendanceSummary(summary);

      // 4. Fetch Payments and Advances histories
      const payments = await getPaymentsForEmployee(uid);
      setPaymentsHistory(payments);

      const advances = await getAdvancesForEmployee(uid);
      setAdvancesHistory(advances);

      // 5. Calculate financials
      const finSummary = calculateEmployeeSalarySummary(logs, payments, advances);
      setFinancials(finSummary);

    } catch (err) {
      console.error(err);
      setProfileErrors({ global: "Failed to load employee details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [uid]);

  // Actions
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSuccess("");

    const errs = {};
    if (!editProfile.name.trim()) errs.name = "Full name is required.";
    const ageVal = parseInt(editProfile.age, 10);
    if (isNaN(ageVal) || ageVal < 18 || ageVal > 100) errs.age = "Age must be between 18 and 100.";
    if (!editProfile.phone.trim()) errs.phone = "Phone number is required.";
    if (!editProfile.address.trim()) errs.address = "Address is required.";

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setProfileLoading(true);
    try {
      await updateEmployee(uid, editProfile, currentUser);
      setProfileSuccess("Profile details updated successfully!");
      fetchData();
    } catch (err) {
      setProfileErrors({ global: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPassErrors({});
    setPassSuccess("");

    if (tempPassword.length < 6) {
      setPassErrors({ temp: "Password must be at least 6 characters." });
      return;
    }

    setPassLoading(true);
    try {
      await resetEmployeePassword(uid, tempPassword, employee?.name, currentUser);
      setPassSuccess("Employee password reset successfully.");
      setTempPassword("");
      fetchData();
    } catch (err) {
      setPassErrors({ global: err.message });
    } finally {
      setPassLoading(false);
    }
  };

  const handleAddRate = async (e) => {
    e.preventDefault();
    setRateErrors({});
    setRateSuccess("");

    const errs = {};
    const hr = parseFloat(rateForm.hourRate);
    if (isNaN(hr) || hr < 0) errs.hourRate = "Regular rate must be positive.";
    const ot = parseFloat(rateForm.otHourRate);
    if (isNaN(ot) || ot < 0) errs.otHourRate = "OT rate must be positive.";
    if (!rateForm.effectiveDate) errs.effectiveDate = "Effective date is required.";

    if (Object.keys(errs).length > 0) {
      setRateErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await updateEmployeeRates(uid, rateForm, employee?.name, currentUser);
      setRateSuccess("Salary rate updated successfully!");
      setRateForm({ hourRate: "", otHourRate: "", effectiveDate: new Date().toISOString().split("T")[0] });
      fetchData();
    } catch (err) {
      setRateErrors({ global: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setPayErrors({});
    setPaySuccess("");

    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setPayErrors({ amount: "Payment amount must be positive." });
      return;
    }
    if (amt > financials.finalPayable) {
      setPayErrors({ amount: `Cannot pay more than the final payable amount ($${financials.finalPayable.toFixed(2)}).` });
      return;
    }
    if (!paymentForm.date) {
      setPayErrors({ date: "Payment date is required." });
      return;
    }

    setPayLoading(true);
    try {
      await logSalaryPayment(uid, employee?.name, paymentForm, currentUser);
      setPaySuccess(`Successfully processed payment of $${amt.toFixed(2)}.`);
      setPaymentForm({ amount: "", method: "Cash", date: new Date().toISOString().split("T")[0], remarks: "" });
      fetchData();
    } catch (err) {
      setPayErrors({ global: err.message });
    } finally {
      setPayLoading(false);
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    setAdvErrors({});
    setAdvSuccess("");

    const amt = parseFloat(advanceForm.amount);
    if (isNaN(amt) || amt <= 0) {
      setAdvErrors({ amount: "Advance amount must be positive." });
      return;
    }
    if (!advanceForm.date) {
      setAdvErrors({ date: "Advance date is required." });
      return;
    }

    setAdvLoading(true);
    try {
      await logSalaryAdvance(uid, employee?.name, advanceForm, currentUser);
      setAdvSuccess(`Successfully issued advance of $${amt.toFixed(2)}.`);
      setAdvanceForm({ amount: "", method: "Cash", date: new Date().toISOString().split("T")[0], remarks: "" });
      fetchData();
    } catch (err) {
      setAdvErrors({ global: err.message });
    } finally {
      setAdvLoading(false);
    }
  };

  // Chronological Ledger Calculations
  const getCombinedLedger = () => {
    const list = [];

    // Add Attendance Earnings
    rawAttendanceLogs.forEach((log) => {
      list.push({
        id: `att_${log.date}`,
        date: log.date,
        type: "Earnings",
        change: parseFloat(log.earnings) || 0,
        details: log.isHoliday ? "Holiday Roster" : `Worked: ${log.workingHours} hrs, OT: ${log.otHours} hrs`,
        remarks: log.remarks || "-"
      });
    });

    // Add Payments
    paymentsHistory.forEach((pay) => {
      list.push({
        id: `pay_${pay.id || pay.date}`,
        date: pay.date,
        type: "Payment",
        change: -(parseFloat(pay.amount) || 0),
        details: `Payout via ${pay.method}`,
        remarks: pay.remarks || "-"
      });
    });

    // Add Advances
    advancesHistory.forEach((adv) => {
      list.push({
        id: `adv_${adv.id || adv.date}`,
        date: adv.date,
        type: "Advance",
        change: -(parseFloat(adv.amount) || 0),
        details: `Salary Advance via ${adv.method}`,
        remarks: adv.remarks || "-"
      });
    });

    // Sort Chronologically Ascending to calculate running balance correctly
    list.sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = 0;
    const ledgerWithBalance = list.map((item) => {
      runningBalance += item.change;
      return {
        ...item,
        balance: runningBalance
      };
    });

    // Reverse to display newest transactions first in the UI
    return ledgerWithBalance.reverse();
  };

  const ledgerTimeline = getCombinedLedger();

  // Filter Ledger logs
  const filteredLedger = ledgerTimeline.filter((item) => {
    // 1. Search filter
    const matchesSearch =
      item.remarks.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.details.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      item.date.includes(ledgerSearch);

    // 2. Type filter
    let matchesType = true;
    if (ledgerTypeFilter !== "all") {
      matchesType = item.type.toLowerCase() === ledgerTypeFilter;
    }

    // 3. Date range filter
    let matchesRange = true;
    if (ledgerStartDate && item.date < ledgerStartDate) matchesRange = false;
    if (ledgerEndDate && item.date > ledgerEndDate) matchesRange = false;

    return matchesSearch && matchesType && matchesRange;
  });

  const exportLedgerCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Transaction Type,Details,Amount,Running Balance,Remarks\n";
    
    filteredLedger.forEach((item) => {
      const type = item.type;
      const changeSign = item.change >= 0 ? `+$${item.change.toFixed(2)}` : `-$${Math.abs(item.change).toFixed(2)}`;
      const row = `"${item.date}","${type}","${item.details}","${changeSign}","$${item.balance.toFixed(2)}","${item.remarks}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ledger_${employee?.name}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-56 bg-slate-200 rounded-lg"></div>
          <div className="h-56 bg-slate-200 rounded-lg lg:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Top Header Row */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/owner/employees")}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0d2702]">{employee?.name}</h1>
          <p className="text-slate-500 mt-0.5 text-xs font-semibold">
            Manage employee personal records, credential resets, and salary payments.
          </p>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Days Worked</div>
          <div className="text-lg font-extrabold text-[#0d2702] mt-0.5">{attendanceSummary.totalDaysWorked} days</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Salary Earned</div>
          <div className="text-lg font-extrabold text-slate-700 mt-0.5">${financials.totalEarned.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Salary Paid</div>
          <div className="text-lg font-extrabold text-slate-700 mt-0.5">${financials.totalPaid.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Advance Amount</div>
          <div className="text-lg font-extrabold text-slate-700 mt-0.5">${financials.totalAdvance.toFixed(2)}</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Final Payable</div>
          <div className="text-lg font-extrabold text-emerald-600 mt-0.5">${financials.finalPayable.toFixed(2)}</div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-1.5 pb-0">
        {[
          { id: "profile", label: "Profile & Settings", icon: User },
          { id: "rates", label: "Salary Rates", icon: TrendingUp },
          { id: "payments", label: "Payments Ledger", icon: CreditCard },
          { id: "advances", label: "Advances Ledger", icon: Coins },
          { id: "ledger", label: "Financial Ledger", icon: BookOpen }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-0.5 ${
                activeTab === tab.id
                  ? "border-[#71d300] text-[#0d2702]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Tab 1: Profile Details & Password Reset */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleUpdateProfile} className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5">Personal Information</h3>
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileErrors.global && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{profileErrors.global}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={editProfile.name}
                  onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                  error={profileErrors.name}
                />
                <Input
                  label="Age"
                  type="number"
                  value={editProfile.age}
                  onChange={(e) => setEditProfile({ ...editProfile, age: e.target.value })}
                  error={profileErrors.age}
                />
                <Input
                  label="Phone"
                  value={editProfile.phone}
                  onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })}
                  error={profileErrors.phone}
                />
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email (Read Only)</label>
                  <input
                    type="text"
                    disabled
                    value={employee?.email || ""}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 font-bold outline-none text-xs cursor-not-allowed"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Home Address</label>
                  <textarea
                    value={editProfile.address}
                    onChange={(e) => setEditProfile({ ...editProfile, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none resize-none"
                    rows="2"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2 bg-[#0d2702] hover:bg-[#163c03] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
              >
                Save Profile Details
              </button>
            </form>

            {/* Reset Password */}
            <form onSubmit={handleResetPassword} className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5">Reset Portal Access</h3>
              <Input
                label="New Temporary Password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                error={passErrors.temp}
              />
              {passSuccess && (
                <p className="text-emerald-600 text-[10px] font-bold mt-1">{passSuccess}</p>
              )}
              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
              >
                Reset Password
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Salary Rates & History */}
        {activeTab === "rates" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleAddRate} className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5">Revise Salary Rates</h3>
              {rateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{rateSuccess}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Hourly Rate ($)"
                  type="number"
                  step="0.01"
                  value={rateForm.hourRate}
                  onChange={(e) => setRateForm({ ...rateForm, hourRate: e.target.value })}
                  error={rateErrors.hourRate}
                />
                <Input
                  label="OT Hourly Rate ($)"
                  type="number"
                  step="0.01"
                  value={rateForm.otHourRate}
                  onChange={(e) => setRateForm({ ...rateForm, otHourRate: e.target.value })}
                  error={rateErrors.otHourRate}
                />
                <div className="col-span-2">
                  <DatePicker
                    label="Effective Date"
                    value={rateForm.effectiveDate}
                    onChange={(e) => setRateForm({ ...rateForm, effectiveDate: e.target.value })}
                    error={rateErrors.effectiveDate}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-[#0d2702] hover:bg-[#163c03] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
              >
                Apply New Rates
              </button>
            </form>

            {/* History logs */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5">Salary Revision History</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rateHistory.map((rate) => (
                  <div key={rate.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-[#0d2702]">
                        Reg: ${rate.hourRate.toFixed(2)} | OT: ${rate.otHourRate.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Effective: {rate.effectiveDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payments Ledger */}
        {activeTab === "payments" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleAddPayment} className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5">Process Salary Payment</h3>
              {paySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{paySuccess}</span>
                </div>
              )}
              {payErrors.global && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{payErrors.global}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Amount Paid ($)"
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  error={payErrors.amount}
                />
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payment Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <DatePicker
                    label="Payment Date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    error={payErrors.date}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Partial salary payout for June first half"
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={payLoading}
                className="w-full py-2 bg-[#0d2702] hover:bg-[#163c03] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {payLoading ? "Processing..." : "Process Payout"}
              </button>
            </form>

            {/* Payments list history */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5">Salary Payout History</h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {paymentsHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold text-center py-6">No payments processed yet.</p>
                ) : (
                  paymentsHistory.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-[#0d2702]">Payment of ${p.amount.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Method: {p.method} | Date: {p.date}</div>
                        {p.remarks && <div className="text-[10px] text-slate-500 italic mt-0.5">"{p.remarks}"</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Advances Ledger */}
        {activeTab === "advances" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleAddAdvance} className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5">Issue Salary Advance</h3>
              {advSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{advSuccess}</span>
                </div>
              )}
              {advErrors.global && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{advErrors.global}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Advance Amount ($)"
                  type="number"
                  step="0.01"
                  value={advanceForm.amount}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  error={advErrors.amount}
                />
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Payment Method</label>
                  <select
                    value={advanceForm.method}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, method: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <DatePicker
                    label="Issue Date"
                    value={advanceForm.date}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    error={advErrors.date}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Urgent medical expense advance"
                    value={advanceForm.remarks}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={advLoading}
                className="w-full py-2 bg-[#0d2702] hover:bg-[#163c03] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {advLoading ? "Issuing..." : "Issue Advance"}
              </button>
            </form>

            {/* Advances list history */}
            <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5">Salary Advance History</h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {advancesHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold text-center py-6">No advance records found.</p>
                ) : (
                  advancesHistory.map((a) => (
                    <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-[#0d2702]">Advance of ${a.amount.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Method: {a.method || "Cash"} | Date: {a.date}</div>
                        {a.remarks && <div className="text-[10px] text-slate-500 italic mt-0.5">"{a.remarks}"</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Combined Financial Ledger */}
        {activeTab === "ledger" && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-[#0d2702] flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-[#0d2702]" /> Combined Financial Ledger Roster
              </h3>
              <button
                onClick={exportLedgerCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-slate-200"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Text Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Remarks, Method, Date..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                />
              </div>

              {/* Type selector */}
              <div>
                <select
                  value={ledgerTypeFilter}
                  onChange={(e) => setLedgerTypeFilter(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#71d300]"
                >
                  <option value="all">All Transactions</option>
                  <option value="earnings">Earnings Only</option>
                  <option value="payment">Payments Only</option>
                  <option value="advance">Advances Only</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="sm:col-span-2 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  className="w-1/2 bg-transparent text-[10px] text-slate-700 outline-none cursor-pointer"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  className="w-1/2 bg-transparent text-[10px] text-slate-700 outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Timeline Table */}
            {filteredLedger.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold text-center py-8">No ledger entries match search constraints.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Transaction Type</th>
                      <th className="py-2.5 px-4">Details</th>
                      <th className="py-2.5 px-4">Change</th>
                      <th className="py-2.5 px-4">Running Balance</th>
                      <th className="py-2.5 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredLedger.map((item) => (
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
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{item.details}</td>
                        <td className={`py-3 px-4 font-bold ${item.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {item.change >= 0 ? `+$${item.change.toFixed(2)}` : `-$${Math.abs(item.change).toFixed(2)}`}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">${item.balance.toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate">{item.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
