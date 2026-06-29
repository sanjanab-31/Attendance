import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  PlusCircle,
  Calendar,
  FileText,
  User,
  AlertCircle,
  CreditCard,
  Coins,
  IndianRupee
} from "lucide-react";
import {
  subscribeToEmployees,
  subscribeToTodayAttendance,
  subscribeToRecentActivities,
  subscribeToRecentPayments,
  subscribeToRecentAdvances
} from "../../services/dashboardService";

// Import Reusable Components
import SummaryCard from "../../components/SummaryCard";
import QuickAction from "../../components/QuickAction";
import RecentActivity from "../../components/RecentActivity";

export default function OwnerDashboard() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Real-time financial feeds
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentAdvances, setRecentAdvances] = useState([]);

  // Load state and errors per subscription
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setErrorMsg("");
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. Subscribe to Employees
    const unsubscribeEmployees = subscribeToEmployees(
      (data) => {
        setEmployees(data);
        setLoading(false);
      },
      (err) => {
        setErrorMsg("Failed to sync employee records.");
        setLoading(false);
      }
    );

    // 2. Subscribe to Attendance
    const unsubscribeAttendance = subscribeToTodayAttendance(
      todayStr,
      (data) => {
        setAttendance(data);
      },
      (err) => {
        setErrorMsg("Failed to sync attendance updates.");
      }
    );

    // 3. Subscribe to Activities
    const unsubscribeActivities = subscribeToRecentActivities(
      (data) => {
        setActivities(data);
      },
      (err) => {
        console.error("Activities subscription failed:", err);
      }
    );

    // 4. Subscribe to Payments feed
    const unsubscribePayments = subscribeToRecentPayments(
      (data) => {
        setRecentPayments(data);
      },
      (err) => {
        console.error("Payments subscription failed:", err);
      }
    );

    // 5. Subscribe to Advances feed
    const unsubscribeAdvances = subscribeToRecentAdvances(
      (data) => {
        setRecentAdvances(data);
      },
      (err) => {
        console.error("Advances subscription failed:", err);
      }
    );

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeEmployees();
      unsubscribeAttendance();
      unsubscribeActivities();
      unsubscribePayments();
      unsubscribeAdvances();
    };
  }, []);

  // Compute stats based on real-time snapshots
  const totalEmployees = employees.length;
  const presentCount = attendance.filter(
    (log) => !log.isHoliday && (log.workingHours > 0 || log.otHours > 0)
  ).length;
  const absentCount = Math.max(0, totalEmployees - presentCount);

  // Compute Salary stats
  const totalSalaryPayable = employees.reduce((sum, emp) => sum + (parseFloat(emp.finalPayable) || 0), 0);
  const pendingSalaryCount = employees.filter((emp) => (parseFloat(emp.finalPayable) || 0) > 0).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-7 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3 mt-2"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-200 rounded-lg"></div>
          <div className="h-28 bg-slate-200 rounded-lg"></div>
          <div className="h-28 bg-slate-200 rounded-lg"></div>
          <div className="h-28 bg-slate-200 rounded-lg"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-56 bg-slate-200 rounded-lg"></div>
          <div className="h-56 bg-slate-200 rounded-lg lg:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d2702]">Owner Dashboard</h1>
        <p className="text-slate-500 mt-0.5 text-xs font-semibold">
          Real-time overview of employee attendance, rosters, and operational stats.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2.5 text-rose-600 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* KPI Cards Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Employees"
          value={totalEmployees}
          icon={Users}
          valueClass="text-[#0d2702]"
        />
        <SummaryCard
          title="Present Today"
          value={presentCount}
          icon={UserCheck}
          valueClass="text-slate-700"
        />
        <SummaryCard
          title="Absent Today"
          value={absentCount}
          icon={UserX}
          valueClass="text-rose-600"
        />
        <SummaryCard
          title="Total Salary Payable"
          value={`₹${totalSalaryPayable.toFixed(2)}`}
          icon={IndianRupee}
          valueClass="text-emerald-600"
        />
        <SummaryCard
          title="Pending Payments"
          value={`${pendingSalaryCount} workers`}
          icon={CreditCard}
          valueClass="text-amber-600"
        />
      </div>

      {/* Grid: Shortcuts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Shortcuts */}
        <div className="lg:col-span-1 p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0d2702]">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/owner/employees" label="Add Employee" icon={PlusCircle} />
            <QuickAction to="/owner/attendance" label="Attendance" icon={Calendar} />
            <QuickAction to="/owner/reports" label="Reports" icon={FileText} />
            <QuickAction to="/owner/profile" label="My Profile" icon={User} />
          </div>
        </div>

        {/* Recent Activity Panel */}
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} />
        </div>
      </div>

      {/* Financial Feeds Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments Feed */}
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0d2702] flex items-center gap-2">
            <CreditCard className="w-4.5 h-4.5 text-[#71d300]" /> Recent Payments Issued
          </h3>
          <div className="space-y-2.5">
            {recentPayments.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold text-center py-4">No recent payouts.</p>
            ) : (
              recentPayments.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Method: {p.method} | Date: {p.date}</div>
                  </div>
                  <div className="font-extrabold text-[#0d2702]">+₹{p.amount.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Advances Feed */}
        <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0d2702] flex items-center gap-2">
            <Coins className="w-4.5 h-4.5 text-[#71d300]" /> Recent Advances Issued
          </h3>
          <div className="space-y-2.5">
            {recentAdvances.length === 0 ? (
              <p className="text-xs text-slate-400 font-semibold text-center py-4">No recent advances.</p>
            ) : (
              recentAdvances.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{a.name}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Method: {a.method || "Cash"} | Date: {a.date}</div>
                  </div>
                  <div className="font-extrabold text-amber-600">+₹{a.amount.toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
