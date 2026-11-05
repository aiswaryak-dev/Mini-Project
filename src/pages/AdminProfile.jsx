import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Key, 
  Lock, 
  Hash, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  Shield
} from 'lucide-react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export const AdminProfile = () => {
  const { currentUser } = useAuth();

  // Active admin UID and fallback info
  const activeAdminUid = auth.currentUser?.uid || currentUser?.uid || 'Cz1G2iQdNOdGOWjks0asuWNznUi1';
  const activeAdminEmail = auth.currentUser?.email || currentUser?.email || 'admin@plantcare.io';

  // State for profile fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Active');

  // UI state
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // Security state
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState(null);
  const [securityError, setSecurityError] = useState(null);

  // Load Admin Profile from Firestore (users/{activeAdminUid})
  useEffect(() => {
    if (!activeAdminUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const adminDocRef = doc(db, 'users', activeAdminUid);

    const unsubscribe = onSnapshot(adminDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFullName(data.fullName || data.displayName || data.name || 'System Administrator');
        setPhone(data.phoneNumber || data.phone || '');
        setStatus(data.status || 'Active');
      } else {
        // Fallback default admin profile values if document doesn't exist yet
        setFullName(currentUser?.displayName || 'System Administrator');
        setPhone('');
        setStatus('Active');
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore admin profile listener warning:", err);
      setProfileError("Failed to fetch profile details from Firestore.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeAdminUid, currentUser]);

  // Handle Edit Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setProfileError("Full Name cannot be empty.");
      return;
    }

    setIsSaving(true);

    try {
      const adminDocRef = doc(db, 'users', activeAdminUid);
      const updateData = {
        fullName: trimmedName,
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        email: activeAdminEmail,
        role: 'admin',
        status: 'Active'
      };

      await setDoc(adminDocRef, updateData, { merge: true });

      setProfileSuccess("Admin profile updated successfully!");
      setIsEditing(false);

      setTimeout(() => {
        setProfileSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error saving admin profile:", err);
      setProfileError(err.message || "Failed to save profile changes to Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileError(null);
  };

  // Send Password Reset Email via Firebase Auth
  const handleSendPasswordReset = async () => {
    setSecurityError(null);
    setSecuritySuccess(null);
    setIsSendingReset(true);

    try {
      if (!activeAdminEmail || activeAdminEmail === 'guest') {
        throw new Error("No valid administrator email address found.");
      }

      await sendPasswordResetEmail(auth, activeAdminEmail);
      setSecuritySuccess(`Password reset email sent to ${activeAdminEmail}. Please check your inbox.`);
    } catch (err) {
      console.error("Error sending password reset email:", err);
      let msg = "Failed to send password reset email.";
      if (err.code === 'auth/user-not-found') {
        msg = "No user found with this administrator email address.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Invalid email address format.";
      } else if (err.message) {
        msg = err.message;
      }
      setSecurityError(msg);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 select-none transition-colors duration-300">
      
      {/* Top Header Row */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-[#16883D] dark:text-[#22C55E] tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 stroke-[2.5]" />
          <span>Admin Profile</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Administrator account settings, metadata, and security management.
        </p>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        
        {/* Card 1: Admin Profile Banner */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-[#2A2E36] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-colors duration-300">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#16883D] text-white flex items-center justify-center text-2xl font-black shadow-md shrink-0">
              {(fullName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                <span>{fullName || 'System Administrator'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeAdminEmail}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Profile Information */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-6 transition-colors duration-300">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Profile Information</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">View and update administrative profile metadata.</p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-[#EAF6E8] dark:bg-[#132B1F] hover:bg-[#d8edd4] dark:hover:bg-[#1b3d2b] text-[#16883D] dark:text-[#22C55E] text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Success Banner */}
          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#16883D] dark:text-[#22C55E] text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {profileError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Full Name (Editable when isEditing) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Full Name {isEditing && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={!isEditing || loading}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
                      isEditing 
                        ? 'border-slate-300 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#16883D]' 
                        : 'border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-slate-800 dark:text-slate-200 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* Email Address (Read-Only) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={activeAdminEmail}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-100 dark:bg-[#1A1D23] text-xs font-bold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone Number (Editable when isEditing) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    maxLength={10}
                    disabled={!isEditing || loading}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit phone number"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all ${
                      isEditing 
                        ? 'border-slate-300 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#16883D]' 
                        : 'border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-slate-800 dark:text-slate-200 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>

              {/* Role (Read-Only) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Account Role
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value="System Administrator"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-100 dark:bg-[#1A1D23] text-xs font-bold text-[#16883D] dark:text-[#22C55E] outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Account Status (Read-Only) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Account Status
                </label>
                <div className="relative">
                  <CheckCircle2 className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled
                    value={status}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-100 dark:bg-[#1A1D23] text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

            </div>

            {/* Action Buttons for Edit Mode */}
            {isEditing && (
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#2A2E36]">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] hover:bg-slate-50 dark:hover:bg-[#222630] text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </form>

        </div>

      </div>

    </div>
  );
};
