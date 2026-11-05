import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, UserPlus, Sprout, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ onClose }) => {
  const { login, signup, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setPhoneError('');

    if (isSignUp) {
      console.log("REGISTRATION: validation starting");
      if (!phoneNumber || !phoneNumber.trim()) {
        setPhoneError("Please provide your phone number.");
        return;
      }

      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setPhoneError("Please enter a valid 10-digit phone number.");
        setError("Please enter a valid 10-digit phone number.");
        return;
      }

      if (password !== confirmPassword && confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      console.log("REGISTRATION: validation passed");
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, fullName, phoneNumber);
      } else {
        await login(email, password);
      }
      setLoading(false);
      onClose();
      navigate('/dashboard');
    } catch (err) {
      console.error("Firebase Auth Error:", err);
      let errorMsg = "Unable to complete operation. Please check your details and try again.";
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'firestore/profile-save-failed' || message.includes('profile information could not be saved')) {
        errorMsg = "Account created, but profile information could not be saved. Please try again.";
      } else if (code === 'auth/user-not-found') {
        errorMsg = "No account found with this email.";
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        errorMsg = "Incorrect email or password.";
      } else if (code === 'auth/invalid-email') {
        errorMsg = "Please enter a valid email address.";
      } else if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
        errorMsg = "Unable to connect to Firebase. Please check your internet connection and try again.";
      } else if (code === 'auth/email-already-in-use') {
        errorMsg = "An account already exists with this email address.";
      } else if (code === 'auth/weak-password') {
        errorMsg = "Password should be at least 6 characters long.";
      } else if (code === 'auth/too-many-requests') {
        errorMsg = "Access temporarily restricted due to multiple failed login attempts. Please try again later.";
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 min-h-[520px]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Brand Hero & Illustration */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-center space-y-6 relative py-4">
          
          {/* Top Logo */}
          <div className="p-2.5 rounded-full bg-[#16883D] text-white flex items-center justify-center shadow-md">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="space-y-2 max-w-xs">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#063D24] leading-tight">
              AI-Based Smart Plant Monitoring and Care System
            </h2>
            <div className="w-10 h-0.5 bg-[#16883D] mx-auto opacity-60 my-2"></div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Intelligent plant care for a healthier and greener tomorrow.
            </p>
          </div>

          {/* Plant Graphic with Heart Background Watermark */}
          <div className="relative w-48 h-48 flex items-center justify-center mt-2">
            {/* Heart Watermark Shape */}
            <svg className="absolute w-44 h-44 text-[#EAF6E8]/70" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 88 C 20 60, 5 35, 25 15 C 38 3, 50 20, 50 20 C 50 20, 62 3, 75 15 C 95 35, 80 60, 50 88 Z" />
            </svg>

            {/* Potted Plant Graphic */}
            <div className="relative z-10 flex flex-col items-center">
              <svg className="w-24 h-24 text-[#16883D]" viewBox="0 0 64 64" fill="currentColor">
                <path d="M32 40 C 20 30, 10 15, 25 5 C 35 15, 33 28, 32 40 Z" fill="#16883D" />
                <path d="M32 40 C 44 30, 54 15, 39 5 C 29 15, 31 28, 32 40 Z" fill="#22C55E" />
                <path d="M32 48 L32 20" stroke="#16883D" strokeWidth="3" />
                <path d="M32 28 C 20 22, 12 10, 18 5 C 26 12, 28 20, 32 28 Z" fill="#22C55E" />
                <path d="M32 30 C 44 24, 52 12, 46 7 C 38 14, 36 22, 32 30 Z" fill="#16883D" />
              </svg>

              {/* White Pot Graphic */}
              <div className="w-16 h-10 bg-white rounded-b-2xl border-t-2 border-slate-300 shadow-md border-x border-b border-slate-200"></div>
            </div>
          </div>

        </div>

        {/* Right Column: Login or Create Account Card */}
        <div className="w-full md:w-1/2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
          
          {!isSignUp ? (
            /* Login Form (Screenshot 4) */
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-extrabold text-[#063D24]">Login</h3>
                <p className="text-xs text-slate-500 font-medium">Welcome back! Please login to continue.</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#16883D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-emerald-300 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium bg-[#FEFCE8] text-slate-800"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#16883D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-emerald-300 text-xs focus:ring-2 focus:ring-[#16883D] outline-none font-medium bg-[#FEFCE8] text-slate-800"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{loading ? 'Logging in...' : 'Login'}</span>
                </button>

              </form>

              <div className="relative flex items-center justify-center my-4">
                <div className="w-full border-t border-slate-200"></div>
                <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">OR</span>
              </div>

              {/* Create New Account Outline Button */}
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); setPhoneError(''); }}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4 text-[#16883D]" />
                <span>Create New Account</span>
              </button>

            </div>
          ) : (
            /* Create Account Form (Screenshot 5) */
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-2xl font-extrabold text-[#063D24]">Create Account</h3>
                <p className="text-xs text-slate-500 font-medium">Register to get started and explore the smart way to care for your plants.</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* 2 Col Row: Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#16883D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-300 text-xs focus:ring-2 focus:ring-[#16883D] outline-none bg-[#FEFCE8] text-slate-800"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                        if (phoneError) setPhoneError('');
                      }}
                      placeholder="Enter 10-digit phone number"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none text-slate-800"
                    />
                  </div>
                  {phoneError && (
                    <p className="text-red-500 text-[11px] font-medium mt-1">{phoneError}</p>
                  )}
                </div>


                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#16883D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 rounded-xl border border-emerald-300 text-xs focus:ring-2 focus:ring-[#16883D] outline-none bg-[#FEFCE8] text-slate-800"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none text-slate-800"
                    />
                  </div>
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Registering...' : 'Register'}</span>
                </button>

              </form>

              <div className="relative flex items-center justify-center my-3">
                <div className="w-full border-t border-slate-200"></div>
                <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">OR</span>
              </div>

              {/* Already have an account? Login Button */}
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); setPhoneError(''); }}
                className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1"
              >
                <User className="w-4 h-4 text-[#16883D]" />
                <span>Already have an account? <span className="text-[#16883D]">Login</span></span>
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
