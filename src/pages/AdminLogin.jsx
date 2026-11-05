import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Sprout, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { ThemeToggle } from '../components/ThemeToggle';

export const AdminLogin = ({ onAdminLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      console.log(`[Admin Auth] Initiating Firebase Authentication for: ${cleanEmail}`);
      
      // 1. Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const authenticatedUser = userCredential.user;
      console.log(`[Admin Auth] Firebase Auth succeeded for UID: ${authenticatedUser?.uid}`);
      
      // 2. Retrieve Firestore user document to verify administrator role
      let isAdmin = false;
      let roleVerificationError = null;

      try {
        if (authenticatedUser?.uid) {
          const userDocRef = doc(db, 'users', authenticatedUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData?.role === 'admin') {
              isAdmin = true;
            }
          }
        }
      } catch (roleErr) {
        console.warn("[Admin Auth] Role verification error:", roleErr);
        roleVerificationError = roleErr;
      }

      if (roleVerificationError) {
        sessionStorage.removeItem('adminAuth');
        try {
          await signOut(auth);
        } catch (_) {}
        setError("Unable to verify account role. Please check your network connection and try again.");
        setLoading(false);
        return;
      }

      if (!isAdmin) {
        console.warn(`[Admin Auth] Access denied: User ${cleanEmail} (UID: ${authenticatedUser?.uid}) does not have administrator role.`);
        sessionStorage.removeItem('adminAuth');
        try {
          await signOut(auth);
        } catch (signOutErr) {
          console.warn("[Admin Auth] Error signing out non-admin session:", signOutErr);
        }
        setError("Access denied. These credentials belong to a regular user account. Please use the User Login page.");
        setLoading(false);
        return;
      }

      console.log("[Admin Auth] Administrator authorization verified. Establishing admin session...");
      sessionStorage.setItem('adminAuth', 'true');
      if (onAdminLogin) onAdminLogin();
      navigate('/admin/dashboard');
    } catch (err) {
      console.warn(`[Admin Auth] Firebase Auth error code: ${err?.code || 'unknown'}, message: ${err?.message || String(err)}`);

      let msg = "Incorrect password or admin account not found.";
      if (err.code === 'auth/user-not-found') {
        msg = "Admin account not found in Firebase Authentication.";
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = "Incorrect password or admin account not found.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Invalid email address format.";
      } else if (err.code === 'auth/network-request-failed') {
        msg = "Unable to connect to Firebase. Please check your network connection.";
      } else if (err.code === 'auth/too-many-requests') {
        msg = "Too many failed login attempts. Please try again later.";
      } else if (err.message) {
        msg = err.message;
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAF8] dark:bg-[#0F1115] flex items-center justify-center p-4 sm:p-8 select-none transition-colors duration-300 relative">
      
      <div className="max-w-4xl w-full bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-10 shadow-elevated border border-slate-100 dark:border-[#2A2E36] flex flex-col md:flex-row items-center gap-8 min-h-[520px] transition-colors duration-300">
        
        {/* Left Column: Brand Hero */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center space-y-6 relative py-4">
          <div className="p-2.5 rounded-full bg-[#16883D] text-white flex items-center justify-center shadow-md">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="space-y-2 max-w-xs sm:max-w-sm px-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#063D24] dark:text-[#F1F5F9] leading-tight">
              FloraPulse: AI-Based Smart Plant Monitoring and Care System
            </h1>
            <div className="w-10 h-0.5 bg-[#16883D] dark:bg-[#22C55E] mx-auto opacity-60 my-1.5"></div>
            <h2 className="text-base sm:text-lg font-bold text-[#16883D] dark:text-[#22C55E]">
              Admin Login
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Secure access for system administrators to manage plant data and system activities.
            </p>
          </div>

          {/* Plant Graphic */}
          <div className="relative w-40 h-40 flex items-center justify-center mt-2">
            <svg className="w-20 h-20 text-[#16883D]" viewBox="0 0 64 64" fill="currentColor">
              <path d="M32 40 C 20 30, 10 15, 25 5 C 35 15, 33 28, 32 40 Z" fill="#16883D" />
              <path d="M32 40 C 44 30, 54 15, 39 3 C 29 13, 31 28, 32 40 Z" fill="#22C55E" />
              <path d="M32 48 L32 20" stroke="#16883D" strokeWidth="3" />
            </svg>
            <div className="w-14 h-9 bg-slate-100 rounded-b-xl border-t-2 border-slate-300 shadow-sm absolute bottom-0"></div>
          </div>
        </div>

        {/* Right Column: Admin Login Form */}
        <div className="w-full md:w-1/2 bg-white dark:bg-[#14171E] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-[#2A2E36] shadow-sm transition-colors duration-300">
          
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-extrabold text-[#063D24] dark:text-[#F1F5F9]">Admin Login</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enter administrator credentials to access dashboard.</p>
            </div>

            {error && (
              <div 
                role="alert"
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-2.5 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Admin Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#16883D] dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium bg-[#FEFCE8] dark:bg-[#222630] text-slate-800 dark:text-slate-100"
                    placeholder="Enter admin email address"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Admin Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#16883D] dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700/60 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium bg-[#FEFCE8] dark:bg-[#222630] text-slate-800 dark:text-slate-100"
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{loading ? 'Authenticating Admin...' : 'Login as Admin'}</span>
              </button>

            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs text-slate-500 hover:text-[#16883D] font-medium"
              >
                ← Back to User Login
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Bottom-Right Theme Toggle */}
      <div className="fixed bottom-5 right-5 z-40">
        <ThemeToggle className="shadow-lg p-2.5" />
      </div>

    </div>
  );
};
