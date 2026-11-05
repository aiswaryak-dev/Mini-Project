import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminSidebar } from './components/AdminSidebar';
import { LoginPage } from './pages/LoginPage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPlants } from './pages/AdminPlants';
import { AdminDiseases } from './pages/AdminDiseases';
import { AdminPests } from './pages/AdminPests';
import { AdminNutrients } from './pages/AdminNutrients';
import { AdminTreatments } from './pages/AdminTreatments';
import { AdminUsers } from './pages/AdminUsers';
import { AdminHistory } from './pages/AdminHistory';
import { AdminReports } from './pages/AdminReports';
import { AdminProfile } from './pages/AdminProfile';
import { Dashboard } from './pages/Dashboard';
import { Category } from './pages/Category';
import { Identification } from './pages/Identification';
import { HealthAnalysis } from './pages/HealthAnalysis';
import { Tracker } from './pages/Tracker';
import { Encyclopedia } from './pages/Encyclopedia';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { useAuth } from './context/AuthContext';

export function App() {
  const { currentUser, isDemoMode, logout } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(() => {
    return sessionStorage.getItem('adminAuth') === 'true';
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && !currentUser.isDemo) {
      setIsLoggedIn(true);
      const isUserAdmin = currentUser.role === 'admin' || currentUser.isAdmin === true;
      setIsAdminAuth(isUserAdmin);
      if (isUserAdmin) {
        sessionStorage.setItem('adminAuth', 'true');
      } else {
        sessionStorage.removeItem('adminAuth');
      }
    } else {
      setIsLoggedIn(false);
      setIsAdminAuth(false);
      sessionStorage.removeItem('adminAuth');
    }
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    setIsLoggedIn(false);
    setIsAdminAuth(false);
    setShowAuthModal(false);
    navigate('/login');
  };

  const handleAdminLogout = async () => {
    await logout();
    setIsAdminAuth(false);
    setIsLoggedIn(false);
    sessionStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  return (
    <Routes>
      {/* Dedicated Admin Login Route */}
      <Route 
        path="/admin/login" 
        element={<AdminLogin onAdminLogin={() => setIsAdminAuth(true)} />} 
      />

      {/* Protected Admin Portal Routes */}
      <Route 
        path="/admin/*" 
        element={
          !isAdminAuth ? (
            <Navigate to="/admin/login" replace />
          ) : (
            <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-[#0F1115] text-[#063D24] dark:text-[#F1F5F9] transition-colors duration-300">
              <AdminNavbar 
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onAdminLogout={handleAdminLogout}
              />
              <div className="flex-1 flex flex-col md:flex-row min-w-0">
                {sidebarOpen && <AdminSidebar onAdminLogout={handleAdminLogout} />}
                <main className="flex-1 min-w-0 bg-[#FAFAF8] dark:bg-[#0F1115] transition-colors duration-300">
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/plants" element={<AdminPlants />} />
                    <Route path="/diseases" element={<AdminDiseases />} />
                    <Route path="/pests" element={<AdminPests />} />
                    <Route path="/nutrients" element={<AdminNutrients />} />
                    <Route path="/treatments" element={<AdminTreatments />} />
                    <Route path="/users" element={<AdminUsers />} />
                    <Route path="/history" element={<AdminHistory />} />
                    <Route path="/reports" element={<AdminReports />} />
                    <Route path="/profile" element={<AdminProfile />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          )
        } 
      />

      {/* Standalone User Login Route */}
      <Route 
        path="/login" 
        element={<LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />} 
      />

      {/* Main Application Layout Routes */}
      <Route
        path="/*"
        element={
          !isLoggedIn ? (
            <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />
          ) : (
            <div className="min-h-screen flex flex-col bg-[#FAFAF8] dark:bg-[#0F1115] text-[#063D24] dark:text-[#F1F5F9] transition-colors duration-300">
              
              {/* Top Navbar */}
              <Navbar 
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onOpenAuth={() => setShowAuthModal(true)}
              />

              {/* Main Body Layout */}
              <div className="flex-1 flex flex-col md:flex-row min-w-0">
                
                {/* Sidebar */}
                {sidebarOpen && <Sidebar onOpenAuth={handleLogout} />}

                {/* Dynamic Page Views */}
                <main className="flex-1 min-w-0 bg-[#FAFAF8] dark:bg-[#0F1115] transition-colors duration-300">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/category" element={<Category />} />
                    <Route path="/identification" element={<Identification />} />
                    <Route path="/health-analysis" element={<HealthAnalysis />} />
                    <Route path="/tracker" element={<Tracker />} />
                    <Route path="/encyclopedia" element={<Encyclopedia />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin/profile" element={<AdminProfile />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>

              </div>

              {/* Optional Quick Auth Modal */}
              {showAuthModal && (
                <AuthModal onClose={() => setShowAuthModal(false)} />
              )}

            </div>
          )
        }
      />
    </Routes>
  );
}

export default App;
