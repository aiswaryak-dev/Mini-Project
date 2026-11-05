import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Info, 
  ChevronDown, 
  Eye, 
  Edit3, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  Phone, 
  Calendar, 
  Hash, 
  Shield 
} from 'lucide-react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Helper to convert Firestore Timestamp / JS Date / String / Number safely to a JS Date object
const toSafeDate = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === 'function') {
    const d = value.toDate();
    return isNaN(d.getTime()) ? null : d;
  }

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object' && value?.seconds !== undefined) {
    const d = new Date(value.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'number') {
    const ms = value < 10000000000 ? value * 1000 : value;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

// Safe date formatter - NEVER outputs "Invalid Date"
const formatSafeDate = (rawVal) => {
  const d = toSafeDate(rawVal);
  if (!d) return 'N/A';
  return d.toLocaleDateString();
};

// Administrator exclusion predicate
const isAdministratorAccount = (user) => {
  if (!user) return false;
  const roleStr = (user.role || user.raw?.role || '').toLowerCase().trim();
  const emailStr = (user.email || user.raw?.email || '').toLowerCase().trim();
  const nameStr = (user.fullName || user.displayName || user.name || user.raw?.fullName || '').toLowerCase().trim();

  // 1. Explicit admin role or flag
  if (roleStr === 'admin' || user.isAdmin === true || user.raw?.isAdmin === true) {
    return true;
  }

  // 2. Administrator emails
  if (
    emailStr.startsWith('admin@') || 
    emailStr.includes('admin') ||
    emailStr === 'admin@plantcare.io' ||
    emailStr === 'admin@smartplant.com' ||
    emailStr === 'admin.system@gmail.com'
  ) {
    return true;
  }

  // 3. System Administrator display name
  if (nameStr.includes('system administrator') || nameStr === 'administrator') {
    return true;
  }

  return false;
};

export const AdminUsers = () => {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState('All Roles');
  const [status, setStatus] = useState('All Status');

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', status: 'Active' });
  const [isSaving, setIsSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(null);
  const [editError, setEditError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);

  // Real-time Firestore Users Listener
  useEffect(() => {
    setLoading(true);
    setError(null);

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const userList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const uid = docSnap.id || data.uid || data.userId || 'N/A';
        const fullName = data.fullName || data.displayName || data.name || 'N/A';
        const email = data.email || 'N/A';
        const phone = data.phoneNumber || data.phone || 'N/A';
        const userStatus = data.status || 'Active';
        const rawRole = data.role || 'User';
        const formattedDate = formatSafeDate(data.createdAt);

        return {
          id: docSnap.id,
          uid,
          fullName,
          email,
          phone,
          role: rawRole,
          status: userStatus,
          createdAt: formattedDate,
          raw: data
        };
      });

      // Filter out ALL System Administrator accounts from Manage Users
      const normalUsers = userList.filter(u => !isAdministratorAccount(u));

      setUsers(normalUsers);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching users from Firestore:", err);
      setError("Failed to load user records from Firebase Firestore.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtered Users computation for Search & Status
  const filteredUsers = users.filter((user) => {
    // Double check administrator exclusion safety
    if (isAdministratorAccount(user)) {
      return false;
    }

    // Search matching
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower || 
      user.fullName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone.toLowerCase().includes(searchLower);

    // Role matching (only normal user roles are displayed)
    let matchesRole = true;
    if (userRole === 'User') matchesRole = (user.role || '').toLowerCase() === 'user';

    // Status matching
    let matchesStatus = true;
    if (status === 'Active') matchesStatus = user.status === 'Active';
    if (status === 'Inactive') matchesStatus = user.status === 'Inactive';

    return matchesSearch && matchesRole && matchesStatus;
  });

  // View User Details
  const handleOpenView = (user) => {
    if (isAdministratorAccount(user)) return;
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  // Edit User
  const handleOpenEdit = (user) => {
    if (isAdministratorAccount(user)) return;
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName !== 'N/A' ? user.fullName : '',
      phone: user.phone !== 'N/A' ? user.phone : '',
      status: user.status || 'Active'
    });
    setEditSuccess(null);
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (isAdministratorAccount(selectedUser)) {
      setEditError("Administrator accounts cannot be modified here.");
      return;
    }

    setEditError(null);
    setEditSuccess(null);

    const trimmedName = editForm.fullName.trim();
    if (!trimmedName) {
      setEditError("Full Name cannot be empty.");
      return;
    }

    setIsSaving(true);

    try {
      const targetUid = selectedUser.uid || selectedUser.id;
      const userDocRef = doc(db, 'users', targetUid);
      const updateData = {
        fullName: trimmedName,
        status: editForm.status
      };
      if (editForm.phone !== undefined) {
        updateData.phoneNumber = editForm.phone;
        updateData.phone = editForm.phone;
      }

      await setDoc(userDocRef, updateData, { merge: true });

      setEditSuccess("User profile updated successfully in Firestore!");
      setTimeout(() => {
        setEditModalOpen(false);
        setEditSuccess(null);
      }, 1200);
    } catch (err) {
      console.error("Error updating user document:", err);
      setEditError(err.message || "Failed to update user profile in Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 select-none transition-colors duration-300">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#16883D] dark:text-[#22C55E] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 stroke-[2.5]" />
            <span>Manage Users</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            View and manage all registered users in the system.
          </p>
        </div>

        {/* Add New User Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#16883D] text-[#16883D] dark:text-[#22C55E] dark:border-[#22C55E] hover:bg-[#16883D] hover:text-white dark:hover:bg-[#16883D] dark:hover:text-white font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Error Alert if Firestore listener fails */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Card */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-5 border border-slate-100 dark:border-[#2A2E36] shadow-sm transition-colors duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          
          {/* Search Input */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Search User
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              />
            </div>
          </div>

          {/* User Role Dropdown */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              User Role
            </label>
            <div className="relative">
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All Roles">All Roles</option>
                <option value="User">User</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Status
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Table Card */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors duration-300 min-h-[360px] flex flex-col justify-between">
        
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-[#2A2E36]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#EAF6E8]/70 dark:bg-[#132B1F] text-[#063D24] dark:text-[#22C55E] font-bold">
              <tr>
                <th className="py-3 px-4">Sl. No.</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#16883D] dark:text-[#22C55E] animate-spin" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Loading registered users from Firebase...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      
                      {/* Empty State Vector Graphic */}
                      <div className="w-16 h-16 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shadow-sm">
                        <Users className="w-8 h-8 stroke-[2]" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          No users found
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {searchTerm || userRole !== 'All Roles' || status !== 'All Status'
                            ? "No registered users match your search criteria."
                            : "There are no normal users registered in the database yet."}
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => (
                  <tr key={user.uid || idx} className="border-t border-slate-100 dark:border-[#2A2E36] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{user.fullName}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">{user.email}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{user.phone}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        User
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        user.status === 'Active' 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenView(user)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(user)}
                          className="px-2.5 py-1 rounded-lg bg-[#EAF6E8] dark:bg-[#132B1F] hover:bg-[#d8edd4] dark:hover:bg-[#1b3d2b] text-[#16883D] dark:text-[#22C55E] text-xs font-bold transition-all flex items-center gap-1"
                          title="Edit User"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Bottom Info Banner */}
      <div className="bg-[#EAF6E8]/70 dark:bg-[#132B1F] border border-[#16883D]/20 dark:border-[#22C55E]/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#063D24] dark:text-[#22C55E] font-semibold">
        <Info className="w-5 h-5 shrink-0" />
        <span>All registered normal users in Firebase Firestore are listed here. Administrator accounts are managed separately.</span>
      </div>

      {/* VIEW USER DETAILS MODAL */}
      {viewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-6">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setViewModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center mb-3">
                <Users className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">User Profile Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Registered user details from Firebase Firestore.
              </p>
            </div>

            {/* Details Fields */}
            <div className="space-y-3 bg-slate-50 dark:bg-[#222630] rounded-2xl p-4 border border-slate-200 dark:border-[#3F4452]">
              
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedUser.fullName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 dark:border-[#3F4452] pt-2.5">
                <Mail className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedUser.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 dark:border-[#3F4452] pt-2.5">
                <Phone className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Number</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedUser.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 dark:border-[#3F4452] pt-2.5">
                <Shield className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Role</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">User</span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 dark:border-[#3F4452] pt-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Status</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedUser.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 dark:border-[#3F4452] pt-2.5">
                <Calendar className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Creation Date</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{selectedUser.createdAt}</span>
                </div>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT USER INFORMATION MODAL */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center mb-2">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Edit User Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Update user metadata stored in Firestore.
              </p>
            </div>

            {/* Error Alert Box */}
            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{editError}</span>
              </div>
            )}

            {/* Success Alert Box */}
            {editSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#16883D] dark:text-[#22C55E] text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16883D] dark:text-[#22C55E]" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                  placeholder="Enter full name"
                />
              </div>

              {/* Email Address (Read-only) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Firebase Auth - Read Only)</span>
                </label>
                <input 
                  type="email"
                  disabled
                  value={selectedUser.email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-100 dark:bg-[#1A1D23] text-xs font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <input 
                  type="tel"
                  maxLength={10}
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                  placeholder="Enter 10-digit phone number"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Account Status
                </label>
                <select 
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] hover:bg-slate-50 dark:hover:bg-[#222630] text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-1/2 py-2.5 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ADD NEW USER INFORMATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center mb-2">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Add New Normal User</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                User authentication security policy information.
              </p>
            </div>

            {/* Explanatory Banner */}
            <div className="p-4 rounded-2xl bg-[#EAF6E8] dark:bg-[#132B1F] border border-[#16883D]/20 dark:border-[#22C55E]/20 text-xs text-[#063D24] dark:text-[#22C55E] space-y-2 font-medium leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0 text-[#16883D] dark:text-[#22C55E]" />
                <span>Secure User Registration Flow</span>
              </p>
              <p>
                To maintain Firebase Authentication security, new accounts must be registered using the application's secure sign-up interface or Firebase Console.
              </p>
              <p>
                Once registered, user profile records are automatically provisioned in Firestore and will appear immediately on this dashboard.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Understood
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
