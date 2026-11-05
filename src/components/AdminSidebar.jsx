import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sprout, 
  Bug, 
  FlaskConical, 
  Pill, 
  Users, 
  History, 
  BarChart3, 
  User, 
  LogOut,
  ShieldAlert
} from 'lucide-react';

export const AdminSidebar = ({ onAdminLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    sessionStorage.removeItem('adminAuth');
    if (onAdminLogout) await onAdminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/plants', name: 'Manage Plants', icon: Sprout },
    { path: '/admin/diseases', name: 'Manage Diseases', icon: ShieldAlert },
    { path: '/admin/pests', name: 'Manage Pests', icon: Bug },
    { path: '/admin/nutrients', name: 'Manage Nutrients', icon: FlaskConical },
    { path: '/admin/treatments', name: 'Manage Treatments', icon: Pill },
    { path: '/admin/users', name: 'Manage Users', icon: Users },
    { path: '/admin/history', name: 'Analysis History', icon: History },
    { path: '/admin/reports', name: 'System Reports', icon: BarChart3 },
    { path: '/admin/profile', name: 'Admin Profile', icon: User },
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-[#14171E] border-b md:border-b-0 md:border-r border-slate-100 dark:border-[#2A2E36] p-5 flex flex-col justify-between shrink-0 min-h-screen select-none transition-colors duration-300">
      
      <div>
        {/* Top Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="p-1.5 rounded-full bg-[#16883D] text-white flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-[13px] leading-tight text-[#16883D] dark:text-[#22C55E]">
              AI-Based Smart Plant
            </h1>
            <p className="text-[11px] font-bold text-[#16883D] dark:text-[#22C55E]">
              Monitoring & Care System
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#16883D] dark:hover:text-[#22C55E]'
                  }`
                }
              >
                <Icon className="w-4 h-4 stroke-[2]" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-all mt-2"
          >
            <LogOut className="w-4 h-4 stroke-[2]" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Bottom Potted Plant Graphic */}
      <div className="pt-6 flex justify-center">
        <div className="w-20 h-28 relative flex flex-col items-center justify-end">
          {/* Leaves Vector Graphic */}
          <svg className="w-16 h-16 text-[#16883D] dark:text-[#22C55E]" viewBox="0 0 64 64" fill="currentColor">
            <path d="M32 40 C 20 30, 10 15, 25 5 C 35 15, 33 28, 32 40 Z" />
            <path d="M32 40 C 44 30, 54 15, 39 5 C 29 15, 31 28, 32 40 Z" fill="#22C55E" />
            <path d="M32 48 L32 20" stroke="#16883D" strokeWidth="3" strokeLinecap="round" />
            <path d="M32 30 C 22 24, 15 15, 20 8 C 28 15, 29 22, 32 30 Z" opacity="0.9" />
            <path d="M32 32 C 42 26, 49 17, 44 10 C 36 17, 35 24, 32 32 Z" fill="#22C55E" opacity="0.9" />
          </svg>
          {/* Pot Graphic */}
          <div className="w-12 h-9 bg-slate-100 dark:bg-slate-800 rounded-b-xl border-t-2 border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center">
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          </div>
        </div>
      </div>

    </aside>
  );
};
