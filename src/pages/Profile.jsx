import React, { useState, useEffect } from 'react';
import { User, Mail, Save, CheckCircle2, Lock, Eye, EyeOff, Key, Edit3, X, AlertCircle, Loader2, Phone } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export const Profile = () => {
  const { currentUser, updateUserProfile, changeUserPassword } = useAuth();
  
  // Profile edit states
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Change password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setPhoneNumber(currentUser.phoneNumber || '');

      if (currentUser.uid && !currentUser.isDemo) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        getDoc(userDocRef).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.phoneNumber !== undefined) {
              setPhoneNumber(data.phoneNumber || '');
            }
            if (data.fullName && !currentUser.displayName) {
              setFullName(data.fullName);
            }
          }
        }).catch((err) => {
          console.warn("Profile Firestore fetch error:", err);
        });
      }
    }
  }, [currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setSaveError("Full Name cannot be empty.");
      return;
    }

    if (phoneNumber) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setSaveError("Please enter a valid 10-digit phone number");
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateUserProfile(trimmedName, phoneNumber);
      setSaveSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setSaveError(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changeUserPassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(null);
      }, 1500);
    } catch (err) {
      console.error("Password change error:", err);
      let msg = "Failed to update password. Please try again.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = "Incorrect current password. Please try again.";
      } else if (err.code === 'auth/weak-password') {
        msg = "New password is too weak. Please use at least 6 characters.";
      } else if (err.message) {
        msg = err.message;
      }
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      
      {/* Header Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-[#063D24] flex items-center gap-2">
          My Profile <User className="w-6 h-6 text-[#16883D] fill-[#16883D]" />
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Manage your account credentials and personal profile information.
        </p>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: Avatar & User Summary */}
        <div className="md:col-span-4 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center space-y-4 min-h-[320px]">
          
          <div className="w-20 h-20 rounded-full bg-[#16883D] text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
            {fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
          </div>

          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-lg">{fullName || 'Registered User'}</h3>
            <p className="text-xs text-slate-500 font-medium">{email}</p>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-[#EAF6E8] text-[#16883D] font-bold text-xs inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16883D]"></span>
              Active Account
            </span>
          </div>

          {/* Change Password Button */}
          <button
            type="button"
            onClick={() => { setShowPasswordModal(true); setPasswordError(null); setPasswordSuccess(null); }}
            className="w-full mt-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            <Key className="w-4 h-4 text-[#16883D]" />
            <span>Change Password</span>
          </button>

        </div>

        {/* Right Card: Personal Information Form */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Section Header: Personal Information & Edit Toggle */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                Personal Information
              </h4>

              <button
                type="button"
                onClick={() => { setIsEditing(!isEditing); setSaveError(null); setSaveSuccess(null); }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border ${
                  isEditing 
                    ? 'border-slate-300 text-slate-600 bg-slate-100 hover:bg-slate-200' 
                    : 'border-emerald-300 text-[#16883D] bg-[#EAF6E8] hover:bg-[#d8edd4]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
            </div>

            {/* Error Alert Box */}
            {saveError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Success Alert Box */}
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16883D] text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16883D]" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Full Name {isEditing && <span className="text-emerald-600">*</span>}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    disabled={!isEditing}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none font-medium transition-all ${
                      isEditing
                        ? 'border-2 border-[#16883D] bg-white text-slate-900 focus:ring-2 focus:ring-[#16883D]/20 shadow-sm'
                        : 'border border-slate-200 bg-slate-50/70 text-slate-700 cursor-not-allowed'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email Address (Connected to Firebase User) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email"
                    disabled
                    readOnly
                    value={email}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-500 font-medium bg-slate-100/70 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Phone Number {isEditing && <span className="text-emerald-600">*</span>}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="tel"
                    disabled={!isEditing}
                    maxLength={10}
                    value={isEditing ? phoneNumber : (phoneNumber || "Not provided")}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none font-medium transition-all ${
                      isEditing
                        ? 'border-2 border-[#16883D] bg-white text-slate-900 focus:ring-2 focus:ring-[#16883D]/20 shadow-sm'
                        : 'border border-slate-200 bg-slate-50/70 text-slate-700 cursor-not-allowed'
                    }`}
                    placeholder="Enter 10-digit phone number"
                  />
                </div>
              </div>

            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="pt-2 animate-fadeIn">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </form>

        </div>

      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative space-y-5 animate-scaleUp">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 text-center pr-6">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center mx-auto mb-2">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Change Password</h3>
              <p className="text-xs text-slate-500 font-medium">
                Enter your current password and set a new password for your account.
              </p>
            </div>

            {/* Error Alert Box */}
            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Success Alert Box */}
            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16883D] text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16883D]" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              
              {/* Current Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-1/2 py-2.5 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
