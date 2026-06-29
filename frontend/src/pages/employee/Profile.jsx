import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { subscribeToEmployeeRateHistory } from "../../services/employeePortalService";
import { User, History, MapPin, Phone, Calendar, Lock, Mail, CheckCircle, AlertCircle } from "lucide-react";
import Input from "../../components/employee/Input";

export default function EmployeeProfile() {
  const { currentUser, changePassword } = useAuth();
  const [rateHistory, setRateHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [passErrors, setPassErrors] = useState({});
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Stream rate history revision logs via employeePortalService
    const unsubscribe = subscribeToEmployeeRateHistory(
      currentUser.uid,
      (data) => {
        setRateHistory(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassErrors({});
    setPassSuccess("");

    if (newPassword.length < 6) {
      setPassErrors({ new: "Password must be at least 6 characters." });
      return;
    }

    setPassLoading(true);
    try {
      await changePassword(newPassword);
      setPassSuccess("Password updated successfully.");
      setNewPassword("");
    } catch (err) {
      setPassErrors({ global: err.message });
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-60 bg-slate-200 rounded-lg lg:col-span-2"></div>
          <div className="h-60 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const activeRate = rateHistory[0] || { hourRate: 0, otHourRate: 0 };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d2702] flex items-center gap-3">
          <User className="w-7 h-7 text-[#0d2702]" />
          My Profile Details
        </h1>
        <p className="text-slate-500 mt-0.5 text-xs font-semibold">
          Detailed overview of your registered personal and contractual rate details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Personal Info & Password Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Read Only Details */}
          <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0d2702]" /> Personal & Contact Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Full Name</div>
                <div className="text-slate-800 mt-1">{currentUser?.name}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Email Address</div>
                <div className="text-slate-800 mt-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {currentUser?.email}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Employee ID</div>
                <div className="text-slate-800 mt-1 font-mono">{currentUser?.uid}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Age</div>
                <div className="text-slate-800 mt-1">{currentUser?.age} yrs</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Phone Number</div>
                <div className="text-slate-800 mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {currentUser?.phone}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Date of Joining</div>
                <div className="text-slate-800 mt-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {currentUser?.dateOfJoining}</div>
              </div>

              <div className="md:col-span-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Home Address</div>
                <div className="text-slate-800 mt-1 leading-relaxed flex items-start gap-1"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {currentUser?.address}</div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <form onSubmit={handleUpdatePassword} className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#0d2702]" /> Change Portal Password
            </h3>
            
            {passSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{passSuccess}</span>
              </div>
            )}
            {passErrors.global && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{passErrors.global}</span>
              </div>
            )}

            <div className="max-w-sm">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={passErrors.new}
              />
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="py-2 px-5 bg-[#0d2702] hover:bg-[#163c03] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Right Side: Contractual Rates & History */}
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Billing Rates</h3>
            <div className="grid grid-cols-2 gap-3 font-semibold">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Regular Hour</div>
                <div className="text-base font-extrabold text-[#0d2702] mt-0.5">${activeRate.hourRate?.toFixed(2)}/hr</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[9px] text-slate-400 uppercase font-bold">Overtime Hour</div>
                <div className="text-base font-extrabold text-[#0d2702] mt-0.5">${activeRate.otHourRate?.toFixed(2)}/hr</div>
              </div>
            </div>
          </div>

          {/* Revision logs */}
          <div className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" /> Rate Revision Logs
            </h3>
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {rateHistory.map((rate) => (
                <div key={rate.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-[#0d2702]">
                      Reg: ${rate.hourRate?.toFixed(2)} | OT: ${rate.otHourRate?.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-slate-400 font-semibold mt-0.5">Effective: {rate.effectiveDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
