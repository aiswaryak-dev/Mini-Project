import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export const Navbar = ({ onToggleSidebar, onOpenAuth }) => {
  const { currentUser, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin === true;

  const displayName = isAdmin 
    ? 'System Administrator' 
    : (currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User');

  const handleProfileClick = () => {
    if (isAdmin) {
      navigate('/admin/profile');
    } else {
      navigate('/profile');
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-[#1A1D23] border-b border-slate-100 dark:border-[#2A2E36] px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
      
      {/* Left: Hamburger menu */}
      <button 
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        title="Toggle Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Right: Theme Toggle & User profile pill */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* User Pill */}
        <div 
          onClick={handleProfileClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16883D] dark:bg-[#16883D] text-white text-xs font-semibold cursor-pointer shadow-sm hover:bg-[#127132] transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 fill-white" />
          </div>
          <span>{displayName}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </div>

      </div>

    </header>
  );
};

