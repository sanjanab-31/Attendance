import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeToEmployeeProfile,
  subscribeToEmployeeAttendance,
  subscribeToEmployeePayments,
  subscribeToEmployeeAdvances
} from "../../services/employeePortalService";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Coins,
  User,
  Clock,
  CalendarCheck
} from "lucide-react";

// Reusable Summary Card Component for Employee Dashboard
function EmployeeSummaryCard({ title, value, icon: Icon, colorClass = "text-[#0d2702]" }) {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{title}</div>
        <div className={`text-lg font-extrabold mt-0.5 ${colorClass}`}>{value}</div>
      </div>
      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  
  // Real-time Firestore profiles and datasets
  const [userProfile, setUserProfile] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [advances, setAdvances] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // 1. Subscribe to employee user document
    const unsubscribeProfile = subscribeToEmployeeProfile(
      currentUser.uid,
      (data) => {
        setUserProfile(data);
        setLoading(false);
      },
      (err) => console.error(err)
    );

    // 2. Subscribe to employee attendance logs
    const unsubscribeAttendance = subscribeToEmployeeAttendance(
      currentUser.uid,
      (data) => setAttendanceLogs(data),
      (err) => console.error(err)
    );

    // 3. Subscribe to payments feed
    const unsubscribePayments = subscribeToEmployeePayments(
      currentUser.uid,
      (data) => setPayments(data),
      (err) => console.error(err)
    );

    // 4. Subscribe to advances feed
    const unsubscribeAdvances = subscribeToEmployeeAdvances(
      currentUser.uid,
      (data) => setAdvances(data),
      (err) => console.error(err)
    );

    return () => {
      unsubscribeProfile();
      unsubscribeAttendance();
      unsubscribePayments();
      unsubscribeAdvances();
    };
  }, [currentUser]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-200 rounded-lg"></div>
          <div className="h-48 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Attendance Aggregations
  const totalDaysWorked = attendanceLogs.filter(
    (log) => !log.isHoliday && (parseFloat(log.workingHours) > 0 || parseFloat(log.otHours) > 0)
  ).length;
  const totalHolidays = attendanceLogs.filter((log) => log.isHoliday).length;
  const totalHoursWorked = attendanceLogs.reduce((sum, log) => sum + (parseFloat(log.workingHours) || 0), 0);
  const totalOTHours = attendanceLogs.reduce((sum, log) => sum + (parseFloat(log.otHours) || 0), 0);

  // Financial aggregates
  const currentEarned = parseFloat(userProfile?.totalEarned) || 0;
  const currentPayable = parseFloat(userProfile?.finalPayable) || 0;
  const totalPaid = parseFloat(userProfile?.totalPaid) || 0;
  const totalAdvance = parseFloat(userProfile?.totalAdvance) || 0;

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Header Panel */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d2702]">
          Employee Dashboard
        </h1>
        <p className="text-slate-500 mt-0.5 text-xs font-semibold">
          Secure, read-only portal for tracking your attendance history, pay rates, and running ledger.
        </p>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <EmployeeSummaryCard title="Salary Earned" value={`$${currentEarned.toFixed(2)}`} icon={TrendingUp} />
        <EmployeeSummaryCard
          title="Current Payable"
          value={`$${currentPayable.toFixed(2)}`}
          icon={DollarSign}
          colorClass={currentPayable >= 0 ? "text-emerald-600" : "text-rose-600"}
        />
        <EmployeeSummaryCard title="Salary Paid" value={`$${totalPaid.toFixed(2)}`} icon={CreditCard} />
        <EmployeeSummaryCard title="Advances Balance" value={`$${totalAdvance.toFixed(2)}`} icon={Coins} />
        <EmployeeSummaryCard title="Hours Worked" value={`${totalHoursWorked} hrs`} icon={Clock} />
        <EmployeeSummaryCard title="Overtime Hours" value={`${totalOTHours} hrs`} icon={Clock} />
      </div>

      {/* Overview Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Profile Overview */}
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-[#71d300]" /> Employment Overview
          </h3>
          <div className="grid grid-cols-2 gap-y-3.5 text-xs">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</div>
              <div className="font-extrabold text-slate-800 mt-0.5">{userProfile?.name}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee ID</div>
              <div className="font-mono font-bold text-slate-500 mt-0.5 select-all">{currentUser?.uid.slice(0, 12)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Joined Date</div>
              <div className="font-bold text-slate-700 mt-0.5">{userProfile?.dateOfJoining || "-"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Status</div>
              <div className="inline-block px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 font-extrabold rounded-full text-[9px] mt-0.5 uppercase tracking-wide">
                {userProfile?.status || "Active"}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hourly Regular Rate</div>
              <div className="font-extrabold text-slate-800 mt-0.5">${(userProfile?.hourRate || 0).toFixed(2)}/hr</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overtime Hourly Rate</div>
              <div className="font-extrabold text-[#0d2702] mt-0.5">${(userProfile?.otHourRate || 0).toFixed(2)}/hr</div>
            </div>
          </div>
        </div>

        {/* Panel 2: Attendance Summary */}
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <CalendarCheck className="w-4.5 h-4.5 text-[#71d300]" /> Attendance Roster Summary
          </h3>
          <div className="grid grid-cols-2 gap-y-3.5 text-xs">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Days Worked</div>
              <div className="font-extrabold text-slate-800 mt-0.5">{totalDaysWorked} days</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Holidays Logged</div>
              <div className="font-extrabold text-slate-800 mt-0.5">{totalHolidays} days</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Regular Hours</div>
              <div className="font-extrabold text-slate-800 mt-0.5">{totalHoursWorked} hours</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Overtime Hours</div>
              <div className="font-extrabold text-[#0d2702] mt-0.5">{totalOTHours} hours</div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance List */}
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#0d2702] border-b border-slate-100 pb-2">Recent Shifts Worked</h3>
          <div className="space-y-2">
            {attendanceLogs.length === 0 ? (
              <p className="text-[11px] text-slate-400 font-semibold py-4 text-center">No shifts logged yet.</p>
            ) : (
              attendanceLogs.slice(0, 5).map((log, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{log.date}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {log.isHoliday ? "Holiday" : `Hrs: ${log.workingHours} | OT: ${log.otHours}`}
                    </div>
                  </div>
                  <div className="font-extrabold text-emerald-600">+${(log.earnings || 0).toFixed(2)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments List */}
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#0d2702] border-b border-slate-100 pb-2">Recent Salary Payouts</h3>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-[11px] text-slate-400 font-semibold py-4 text-center">No payouts processed yet.</p>
            ) : (
              payments.slice(0, 5).map((pay) => (
                <div key={pay.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">${pay.amount.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Method: {pay.method} | Date: {pay.date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Advances List */}
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#0d2702] border-b border-slate-100 pb-2">Recent Advances Issued</h3>
          <div className="space-y-2">
            {advances.length === 0 ? (
              <p className="text-[11px] text-slate-400 font-semibold py-4 text-center">No advances issued yet.</p>
            ) : (
              advances.slice(0, 5).map((adv) => (
                <div key={adv.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">${adv.amount.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Method: {adv.method || "Cash"} | Date: {adv.date}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
