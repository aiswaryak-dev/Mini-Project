import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const AdminNavbar = ({ onToggleSidebar, onAdminLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white dark:bg-[#1A1D23] border-b border-slate-100 dark:border-[#2A2E36] px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300">
      
      {/* Left: Hamburger Menu */}
      <button 
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        title="Toggle Sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Right: Theme Toggle & Admin User Pill */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Admin Avatar Pill */}
        <div 
          onClick={() => navigate('/admin/profile')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16883D] text-white text-xs font-semibold cursor-pointer shadow-sm hover:bg-[#127132] transition-colors"
          title="Admin Profile"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 fill-white" />
          </div>
          <span>System Administrator</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </div>

      </div>

    </header>
  );
};

