import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../services/firebase";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import {
  User,
  Lock,
  Mail,
  Phone,
  Building,
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  LogOut,
  Camera,
  Info,
  Settings,
  Globe,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OwnerProfile() {
  const { currentUser, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("owner"); // "owner", "company", "general"
  const [dbLoading, setDbLoading] = useState(true);

  // Tab 1: Owner Profile States
  const [ownerData, setOwnerData] = useState({
    name: "",
    phone: "",
    photoUrl: ""
  });
  const [ownerErrors, setOwnerErrors] = useState({});
  const [ownerSuccess, setOwnerSuccess] = useState("");
  const [ownerLoading, setOwnerLoading] = useState(false);

  // Tab 2: Company Details States
  const [companyData, setCompanyData] = useState({
    name: "",
    logoUrl: "",
    address: "",
    phone: "",
    email: "",
    website: ""
  });
  const [companyErrors, setCompanyErrors] = useState({});
  const [companySuccess, setCompanySuccess] = useState("");
  const [companyLoading, setCompanyLoading] = useState(false);

  // Tab 3: General System Settings
  const [generalData, setGeneralData] = useState({
    currency: "$",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    hourFormat: "24h"
  });
  const [generalErrors, setGeneralErrors] = useState({});
  const [generalSuccess, setGeneralSuccess] = useState("");
  const [generalLoading, setGeneralLoading] = useState(false);

  // Password & Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passErrors, setPassErrors] = useState({});
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  // Load all configurations on mount
  useEffect(() => {
    async function loadConfiguration() {
      if (!currentUser?.uid) return;
      try {
        // 1. Fetch Owner Profile
        const ownerSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (ownerSnap.exists()) {
          const data = ownerSnap.data();
          setOwnerData({
            name: data.name || "",
            phone: data.phone || "",
            photoUrl: data.photoUrl || ""
          });
        }

        // 2. Fetch Company Settings
        const companySnap = await getDoc(doc(db, "settings", "company"));
        if (companySnap.exists()) {
          setCompanyData(companySnap.data());
        } else {
          // Default fallbacks matching owner details
          setCompanyData((prev) => ({
            ...prev,
            name: ownerSnap.data()?.companyName || "ESA Attendance",
            phone: ownerSnap.data()?.phone || "",
            email: currentUser.email || ""
          }));
        }

        // 3. Fetch General Settings
        const generalSnap = await getDoc(doc(db, "settings", "general"));
        if (generalSnap.exists()) {
          setGeneralData(generalSnap.data());
        }
      } catch (err) {
        console.error("Failed to load settings from Firestore:", err);
      } finally {
        setDbLoading(false);
      }
    }
    loadConfiguration();
  }, [currentUser]);

  // Image upload helpers (converting images to base64 chunks)
  const handlePhotoUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      if (type === "owner") setOwnerErrors({ photo: "Image size must be less than 2MB." });
      else setCompanyErrors({ logo: "Logo size must be less than 2MB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "owner") {
        setOwnerData((prev) => ({ ...prev, photoUrl: reader.result }));
        setOwnerErrors({});
      } else {
        setCompanyData((prev) => ({ ...prev, logoUrl: reader.result }));
        setCompanyErrors({});
      }
    };
    reader.readAsDataURL(file);
  };

  // HANDLERS
  const handleUpdateOwner = async (e) => {
    e.preventDefault();
    setOwnerErrors({});
    setOwnerSuccess("");

    if (!ownerData.name.trim()) {
      setOwnerErrors({ name: "Full name is required." });
      return;
    }

    setOwnerLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        name: ownerData.name.trim(),
        phone: ownerData.phone.trim(),
        photoUrl: ownerData.photoUrl
      });
      setOwnerSuccess("Owner details updated successfully!");
    } catch (err) {
      console.error(err);
      setOwnerErrors({ global: "Failed to update profile settings." });
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    setCompanyErrors({});
    setCompanySuccess("");

    const errs = {};
    if (!companyData.name.trim()) errs.name = "Company name is required.";
    if (!companyData.address.trim()) errs.address = "Address is required.";
    if (!companyData.phone.trim()) errs.phone = "Phone number is required.";
    if (!companyData.email.trim()) errs.email = "Email address is required.";

    if (Object.keys(errs).length > 0) {
      setCompanyErrors(errs);
      return;
    }

    setCompanyLoading(true);
    try {
      await setDoc(doc(db, "settings", "company"), companyData);
      
      // Sync companyName back to owner user doc for navigation consistency
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { companyName: companyData.name });

      setCompanySuccess("Company settings saved successfully!");
    } catch (err) {
      console.error(err);
      setCompanyErrors({ global: "Failed to save company settings." });
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    setGeneralErrors({});
    setGeneralSuccess("");

    setGeneralLoading(true);
    try {
      await setDoc(doc(db, "settings", "general"), generalData);
      setGeneralSuccess("General settings applied successfully!");
    } catch (err) {
      console.error(err);
      setGeneralErrors({ global: "Failed to save general settings." });
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleChangePassSubmit = async (e) => {
    e.preventDefault();
    setPassErrors({});
    setPassSuccess("");

    const errors = {};
    if (!currentPassword) errors.current = "Current password is required.";
    if (newPassword.length < 6) errors.new = "New password must be at least 6 characters.";
    if (newPassword !== confirmNewPassword) errors.confirm = "New passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setPassErrors(errors);
      return;
    }

    setPassLoading(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await changePassword(newPassword);
      setPassSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error(err);
      setPassErrors({ global: err.message || "Incorrect current password." });
    } finally {
      setPassLoading(false);
    }
  };

  const handleTriggerForgot = async () => {
    setResetError("");
    setResetSent(false);
    setResetLoading(true);
    try {
      await auth.sendPasswordResetEmail(auth.currentUser.email);
      setResetSent(true);
    } catch (err) {
      setResetError("Failed to trigger reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogoutAction = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (dbLoading) {
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

  const user = auth.currentUser;
  const lastLogin = user?.metadata.lastSignInTime || "N/A";
  const createdDate = user?.metadata.creationTime || "N/A";

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d2702] flex items-center gap-3">
          <Settings className="w-7 h-7 text-[#0d2702]" />
          My Profile & Settings
        </h1>
        <p className="text-slate-500 mt-0.5 text-xs font-semibold">
          Manage your owner credentials, company parameters, and portal security.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-1.5 pb-0">
        {[
          { id: "owner", label: "Owner Settings", icon: User },
          { id: "company", label: "Company Information", icon: Building },
          { id: "general", label: "General Settings", icon: Settings }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card & Session Logs */}
        <div className="space-y-6">
          {/* Avatar Summary card */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-[#71d300] flex items-center justify-center text-slate-500 overflow-hidden shadow-sm">
                {activeTab === "company" ? (
                  companyData.logoUrl ? (
                    <img src={companyData.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building className="w-12 h-12 text-[#0d2702]" />
                  )
                ) : ownerData.photoUrl ? (
                  <img src={ownerData.photoUrl} alt="Owner Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-[#0d2702]" />
                )}
              </div>
              
              <label className="absolute bottom-0 right-0 p-1.5 bg-[#0d2702] text-white rounded-full cursor-pointer hover:bg-[#163c03] transition-colors border border-white">
                <Camera className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, activeTab === "company" ? "company" : "owner")}
                  className="hidden"
                />
              </label>
            </div>
            
            {activeTab === "company" ? (
              <>
                <h3 className="text-base font-bold text-[#0d2702] mt-4">{companyData.name || "Company Name"}</h3>
                <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Enterprise Details</span>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-[#0d2702] mt-4">{ownerData.name || "Owner Name"}</h3>
                <span className="inline-block text-[9px] font-bold bg-[#71d300]/15 text-[#0d2702] border border-[#71d300]/25 px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wider">
                  System Owner
                </span>
              </>
            )}
          </div>

          {/* Security details */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0d2702] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" /> Security Settings
            </h3>
            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Last Login Time</span>
                <span className="text-slate-800 block mt-0.5">{new Date(lastLogin).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Account Created</span>
                <span className="text-slate-800 block mt-0.5">{new Date(createdDate).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogoutAction}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Sign Out of Session
          </button>
        </div>

        {/* Right Column: Active Tab Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab 1: Owner Settings */}
          {activeTab === "owner" && (
            <>
              <form onSubmit={handleUpdateOwner} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5 flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-[#0d2702]" /> Owner Account
                </h3>

                {ownerSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>{ownerSuccess}</span>
                  </div>
                )}
                {ownerErrors.global && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{ownerErrors.global}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                    <input
                      type="text"
                      value={ownerData.name}
                      onChange={(e) => setOwnerData({ ...ownerData, name: e.target.value })}
                      className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={ownerData.phone}
                      onChange={(e) => setOwnerData({ ...ownerData, phone: e.target.value })}
                      className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={ownerLoading}
                  className="px-5 py-2 bg-[#0d2702] hover:bg-[#163c03] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  Save Owner Profile
                </button>
              </form>

              {/* Secure Password Update */}
              <form onSubmit={handleChangePassSubmit} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2 flex items-center gap-2">
                  <Key className="w-4.5 h-4.5 text-[#0d2702]" /> Secure Password Update
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

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0d2702] hover:bg-[#163c03] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerForgot}
                    className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                  >
                    Send Forgot Password Email
                  </button>
                </div>
                {resetSent && <p className="text-emerald-600 text-[10px] font-bold mt-2">Password reset email dispatched.</p>}
              </form>
            </>
          )}

          {/* Tab 2: Company Information */}
          {activeTab === "company" && (
            <form onSubmit={handleUpdateCompany} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Building className="w-4.5 h-4.5 text-[#0d2702]" /> Company Information
              </h3>

              {companySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{companySuccess}</span>
                </div>
              )}
              {companyErrors.global && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{companyErrors.global}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Company Name</label>
                  <input
                    type="text"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Website URL (Optional)</label>
                  <input
                    type="text"
                    value={companyData.website}
                    onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Company Address</label>
                  <textarea
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none resize-none"
                    rows="3"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={companyLoading}
                className="px-5 py-2 bg-[#0d2702] hover:bg-[#163c03] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                Save Company Details
              </button>
            </form>
          )}

          {/* Tab 3: General System Settings */}
          {activeTab === "general" && (
            <form onSubmit={handleUpdateGeneral} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#0d2702] border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Globe className="w-4.5 h-4.5 text-[#0d2702]" /> General Settings
              </h3>

              {generalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{generalSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Default Currency Symbol</label>
                  <select
                    value={generalData.currency}
                    onChange={(e) => setGeneralData({ ...generalData, currency: e.target.value })}
                    className="w-full mt-1.5 px-2 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  >
                    <option value="$">US Dollar ($)</option>
                    <option value="₹">Indian Rupee (₹)</option>
                    <option value="€">Euro (€)</option>
                    <option value="£">Pound (£)</option>
                    <option value="¥">Yen (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">System Time Zone</label>
                  <select
                    value={generalData.timezone}
                    onChange={(e) => setGeneralData({ ...generalData, timezone: e.target.value })}
                    className="w-full mt-1.5 px-2 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  >
                    <option value="UTC">UTC (Greenwich)</option>
                    <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                    <option value="America/New_York">EST (America/New_York)</option>
                    <option value="Europe/London">GMT (Europe/London)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date Format</label>
                  <select
                    value={generalData.dateFormat}
                    onChange={(e) => setGeneralData({ ...generalData, dateFormat: e.target.value })}
                    className="w-full mt-1.5 px-2 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-06-27)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (27-06-2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (06/27/2026)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Working Hours Format</label>
                  <select
                    value={generalData.hourFormat}
                    onChange={(e) => setGeneralData({ ...generalData, hourFormat: e.target.value })}
                    className="w-full mt-1.5 px-2 py-2 bg-slate-50 border border-slate-200 focus:border-[#71d300] rounded-lg text-xs outline-none"
                  >
                    <option value="24h">24-Hour Format (18:30)</option>
                    <option value="12h">12-Hour Format (06:30 PM)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={generalLoading}
                className="px-5 py-2 bg-[#0d2702] hover:bg-[#163c03] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                Save General Settings
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
