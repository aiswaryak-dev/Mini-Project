import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Info, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Sprout, 
  ShieldAlert, 
  Bug, 
  FlaskConical, 
  Activity, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  PieChart, 
  ChevronDown,
  CheckCircle2,
  XCircle,
  BarChart2
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

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

// Administrator exclusion predicate for user statistics
const isAdministratorAccount = (user) => {
  if (!user) return false;
  const roleStr = (user.role || user.raw?.role || '').toLowerCase().trim();
  const emailStr = (user.email || user.raw?.email || '').toLowerCase().trim();
  const nameStr = (user.fullName || user.displayName || user.name || '').toLowerCase().trim();

  if (roleStr === 'admin' || user.isAdmin === true || user.raw?.isAdmin === true) {
    return true;
  }
  if (
    emailStr.startsWith('admin@') || 
    emailStr.includes('admin') ||
    emailStr === 'admin@plantcare.io' ||
    emailStr === 'admin@smartplant.com' ||
    emailStr === 'admin.system@gmail.com'
  ) {
    return true;
  }
  if (nameStr.includes('system administrator') || nameStr === 'administrator') {
    return true;
  }
  return false;
};

// Normalize Analysis Type helper
const getNormalizedAnalysisType = (item) => {
  const typeStr = (item.analysisType || item.type || '').toLowerCase();
  if (typeStr.includes('identif') || typeStr.includes('plant')) {
    return 'Plant Identification';
  }
  if (typeStr.includes('diseas') || typeStr.includes('health') || typeStr.includes('patholog')) {
    return 'Disease Detection';
  }
  if (typeStr.includes('nutri') || typeStr.includes('deficien')) {
    return 'Nutrient Deficiency';
  }
  if (typeStr.includes('pest') || typeStr.includes('bug') || typeStr.includes('insect')) {
    return 'Pest Detection';
  }
  return 'Plant Identification';
};

// Date range check
const isWithinDateFilter = (rawVal, filter) => {
  if (filter === 'All Time') return true;
  const d = toSafeDate(rawVal);
  if (!d) return false;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 3600 * 24);

  if (filter === 'Today') {
    return d.toDateString() === now.toDateString();
  }
  if (filter === 'Last 7 Days') {
    return diffDays <= 7;
  }
  if (filter === 'Last 30 Days') {
    return diffDays <= 30;
  }
  if (filter === 'Last 90 Days') {
    return diffDays <= 90;
  }
  return true;
};

export const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firestore raw datasets
  const [allUsers, setAllUsers] = useState([]);
  const [allAnalyses, setAllAnalyses] = useState([]);

  // Date Filter state
  const [dateFilter, setDateFilter] = useState('All Time');

  // Listen to Firestore 'users' and 'analysisHistory'
  useEffect(() => {
    let unsubs = [];
    setLoading(true);
    setError(null);

    try {
      // 1. Listen to 'users' collection
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const uList = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setAllUsers(uList);
      }, (err) => console.warn("Users listener warning:", err));
      unsubs.push(unsubUsers);

      // 2. Listen to 'analysisHistory' collection
      const unsubHistory = onSnapshot(collection(db, 'analysisHistory'), (snap) => {
        const hList = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Filter ONLY actual AI analysis records (exclude irrigation/watering/activity logs)
        const validAiRecords = hList.filter(item => {
          const typeStr = (item.analysisType || item.type || '').toLowerCase();
          if (typeStr.includes('water') || typeStr.includes('irrigation') || typeStr.includes('activity')) {
            return false;
          }
          return true;
        });

        setAllAnalyses(validAiRecords);
        setLoading(false);
      }, (err) => {
        console.error("Error loading analysis history for reports:", err);
        setError("Failed to load analytics data from Firestore.");
        setLoading(false);
      });
      unsubs.push(unsubHistory);

    } catch (err) {
      console.error("Firestore reports initialization error:", err);
      setError("Failed to connect to Firebase Firestore.");
      setLoading(false);
    }

    return () => {
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, []);

  // Compute Lifetime User Statistics (excluding administrators)
  const normalUsers = allUsers.filter(u => !isAdministratorAccount(u));
  const totalUsersCount = normalUsers.length;
  const activeUsersCount = normalUsers.filter(u => u.status === 'Active' || !u.status).length;
  const inactiveUsersCount = normalUsers.filter(u => u.status === 'Inactive').length;

  // Filter AI Analysis Records by Global Date Filter
  const filteredAnalyses = allAnalyses.filter(item => 
    isWithinDateFilter(item.timestamp || item.createdAt || item.date, dateFilter)
  );

  const totalAnalysesCount = filteredAnalyses.length;

  // Breakdown counts by AI category in selected date range
  const typeCounts = {
    'Plant Identification': 0,
    'Disease Detection': 0,
    'Nutrient Deficiency': 0,
    'Pest Detection': 0
  };

  filteredAnalyses.forEach(item => {
    const normType = getNormalizedAnalysisType(item);
    if (typeCounts[normType] !== undefined) {
      typeCounts[normType]++;
    } else {
      typeCounts['Plant Identification']++;
    }
  });

  // Group Analyses by Date for Timeline Chart
  const timelineGroupMap = {};
  filteredAnalyses.forEach(item => {
    const d = toSafeDate(item.timestamp || item.createdAt || item.date);
    if (d) {
      const dateKey = `${d.getDate()}/${d.getMonth() + 1}`;
      timelineGroupMap[dateKey] = (timelineGroupMap[dateKey] || 0) + 1;
    }
  });

  const timelineKeys = Object.keys(timelineGroupMap).slice(-7); // Top 7 date points
  const maxTimelineVal = Math.max(...Object.values(timelineGroupMap), 1);

  // Helper for Top Frequency List (Diseases, Pests, Nutrients, Plants)
  const getFrequencyList = (items, keyExtractor) => {
    const map = {};
    items.forEach(item => {
      const key = keyExtractor(item);
      if (key && key !== 'N/A' && key !== 'None' && key !== 'Optimal' && key !== 'Healthy' && key !== 'Unknown') {
        map[key] = (map[key] || 0) + 1;
      }
    });

    const list = Object.keys(map).map(k => ({
      name: k,
      count: map[k]
    }));

    list.sort((a, b) => b.count - a.count);
    return list;
  };

  // Disease Statistics
  const diseaseRecords = filteredAnalyses.filter(item => getNormalizedAnalysisType(item) === 'Disease Detection');
  const topDiseases = getFrequencyList(diseaseRecords, d => d.diseaseName || d.disease || (d.diseaseDetected ? 'Disease Detected' : null));

  // Pest Statistics
  const pestRecords = filteredAnalyses.filter(item => getNormalizedAnalysisType(item) === 'Pest Detection');
  const topPests = getFrequencyList(pestRecords, p => p.pestName || p.pestResult);

  // Nutrient Deficiency Statistics
  const nutrientRecords = filteredAnalyses.filter(item => {
    if (getNormalizedAnalysisType(item) !== 'Nutrient Deficiency') return false;
    if (item.deficiencyDetected === false || item.nutritionStatus === 'Optimal') return false;
    return true;
  });
  const topNutrients = getFrequencyList(nutrientRecords, n => n.primaryNutrient || n.nutrientName);

  // Plant Analysis Statistics
  const topPlants = getFrequencyList(filteredAnalyses, p => p.plantName || p.scientificName);

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 select-none transition-colors duration-300">
      
      {/* Top Header Row with Title & Global Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#16883D] dark:text-[#22C55E] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 stroke-[2.5]" />
            <span>System Reports & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Global read-only system metrics, AI diagnostic performance, and user activity intelligence.
          </p>
        </div>

        {/* Global Date Filter Dropdown */}
        <div className="relative shrink-0">
          <div className="flex items-center gap-2 bg-white dark:bg-[#1A1D23] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] shadow-sm">
            <Calendar className="w-4 h-4 text-[#16883D] dark:text-[#22C55E]" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none pr-6 cursor-pointer"
            >
              <option value="All Time">Report Range: All Time</option>
              <option value="Today">Report Range: Today</option>
              <option value="Last 7 Days">Report Range: Last 7 Days</option>
              <option value="Last 30 Days">Report Range: Last 30 Days</option>
              <option value="Last 90 Days">Report Range: Last 90 Days</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Summary Statistics Grid (8 Cards) */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">System Overview</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Normal Users */}
          <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Users</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : totalUsersCount}
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Active Users</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : activeUsersCount}
              </div>
            </div>
          </div>

          {/* Inactive Users */}
          <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Inactive Users</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-rose-600" /> : inactiveUsersCount}
              </div>
            </div>
          </div>

          {/* Total AI Analyses */}
          <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total AI Scans ({dateFilter})</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#16883D]" /> : totalAnalysesCount}
              </div>
            </div>
          </div>

          {/* Plant Identifications */}
          <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sprout className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Plant Identifications</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : typeCounts['Plant Identification']}
              </div>
            </div>
          </div>

          {/* Disease Detections */}
          <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Disease Detections</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-red-500" /> : typeCounts['Disease Detection']}
              </div>
            </div>
          </div>

          {/* Nutrient Deficiency Analyses */}
          <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FlaskConical className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Nutrient Deficiencies</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : typeCounts['Nutrient Deficiency']}
              </div>
            </div>
          </div>

          {/* Pest Detections */}
          <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Bug className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Pest Detections</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-purple-600" /> : typeCounts['Pest Detection']}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Section 2: Visual Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Analysis Overview Timeline */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Analysis Activity Timeline</h3>
            <span className="text-[10px] font-bold text-[#16883D] dark:text-[#22C55E] bg-[#EAF6E8] dark:bg-[#132B1F] px-2.5 py-1 rounded-full">
              {dateFilter}
            </span>
          </div>

          {loading ? (
            <div className="min-h-[180px] flex flex-col items-center justify-center space-y-3 py-6">
              <Loader2 className="w-7 h-7 text-[#16883D] dark:text-[#22C55E] animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading timeline stats...</p>
            </div>
          ) : totalAnalysesCount === 0 || timelineKeys.length === 0 ? (
            <div className="min-h-[180px] flex flex-col items-center justify-center text-center space-y-3 py-6">
              <div className="w-14 h-14 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                <BarChart2 className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">No data available</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">No AI analysis activity recorded for this period.</p>
              </div>
            </div>
          ) : (
            <div className="min-h-[180px] pt-4 pb-2 flex flex-col justify-end space-y-3">
              <div className="flex items-end justify-around h-32 pt-6 px-2 border-b border-slate-100 dark:border-[#2A2E36] gap-2">
                {timelineKeys.map((key) => {
                  const val = timelineGroupMap[key];
                  const heightPct = Math.max(15, Math.round((val / maxTimelineVal) * 100));
                  return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-bold text-[#16883D] dark:text-[#22C55E] opacity-90 group-hover:scale-110 transition-transform">
                        {val}
                      </span>
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-[#16883D] to-[#22C55E] rounded-t-lg shadow-sm group-hover:from-[#127132] group-hover:to-[#16883D] transition-all duration-300"
                      />
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {key}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-center font-medium text-slate-400">
                Diagnostic scans aggregated by active dates in {dateFilter}.
              </p>
            </div>
          )}
        </div>

        {/* Analysis by Type Distribution */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Category Share Breakdown</h3>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              4 AI Modules
            </span>
          </div>

          {loading ? (
            <div className="min-h-[180px] flex flex-col items-center justify-center space-y-3 py-6">
              <Loader2 className="w-7 h-7 text-[#16883D] dark:text-[#22C55E] animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading category breakdown...</p>
            </div>
          ) : totalAnalysesCount === 0 ? (
            <div className="min-h-[180px] flex flex-col items-center justify-center text-center space-y-3 py-6">
              <div className="w-14 h-14 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                <PieChart className="w-7 h-7 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">No data available</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Analysis category share will appear here once available.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {[
                { label: 'Plant Identification', count: typeCounts['Plant Identification'], color: 'bg-emerald-500' },
                { label: 'Disease Detection', count: typeCounts['Disease Detection'], color: 'bg-rose-500' },
                { label: 'Nutrient Deficiency', count: typeCounts['Nutrient Deficiency'], color: 'bg-amber-500' },
                { label: 'Pest Detection', count: typeCounts['Pest Detection'], color: 'bg-purple-500' }
              ].map((item) => {
                const pct = totalAnalysesCount > 0 ? Math.round((item.count / totalAnalysesCount) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{item.count}</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${pct}%` }} 
                        className={`h-full ${item.color} transition-all duration-500 rounded-full`} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Section 3: Botanical Intelligence Reports (Disease & Pest) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Disease Statistics Card */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Disease Frequency Intelligence</span>
            </h3>
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-full">
              {diseaseRecords.length} Detections
            </span>
          </div>

          {topDiseases.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No disease detections recorded</p>
              <p className="text-[11px] text-slate-400">All scanned plants in this period were healthy or no diseases detected.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topDiseases.slice(0, 5).map((dis, idx) => {
                const pct = diseaseRecords.length > 0 ? Math.round((dis.count / diseaseRecords.length) * 100) : 0;
                return (
                  <div key={dis.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#222630] border border-slate-100 dark:border-[#3F4452]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{dis.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{dis.count} cases</span>
                      <span className="text-[10px] font-mono text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pest Statistics Card */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Bug className="w-4 h-4 text-purple-500" />
              <span>Pest Infestation Intelligence</span>
            </h3>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 rounded-full">
              {pestRecords.length} Detections
            </span>
          </div>

          {topPests.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No pest infestations recorded</p>
              <p className="text-[11px] text-slate-400">No pest detection records logged in the selected report range.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topPests.slice(0, 5).map((pest, idx) => {
                const pct = pestRecords.length > 0 ? Math.round((pest.count / pestRecords.length) * 100) : 0;
                return (
                  <div key={pest.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#222630] border border-slate-100 dark:border-[#3F4452]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{pest.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{pest.count} cases</span>
                      <span className="text-[10px] font-mono text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Section 4: Nutrient & Plant Intelligence Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nutrient Deficiency Statistics Card */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-amber-500" />
              <span>Nutrient Deficiency Intelligence</span>
            </h3>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
              {nutrientRecords.length} Deficiencies
            </span>
          </div>

          {topNutrients.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No nutrient deficiencies recorded</p>
              <p className="text-[11px] text-slate-400">No nutrient deficiencies detected in the selected report range.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topNutrients.slice(0, 5).map((nutr, idx) => {
                const pct = nutrientRecords.length > 0 ? Math.round((nutr.count / nutrientRecords.length) * 100) : 0;
                return (
                  <div key={nutr.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#222630] border border-slate-100 dark:border-[#3F4452]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{nutr.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{nutr.count} cases</span>
                      <span className="text-[10px] font-mono text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Analyzed Plants Statistics Card */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Sprout className="w-4 h-4 text-[#16883D] dark:text-[#22C55E]" />
              <span>Most Analyzed Plant Species</span>
            </h3>
            <span className="text-[10px] font-bold text-[#16883D] dark:text-[#22C55E] bg-[#EAF6E8] dark:bg-[#132B1F] px-2.5 py-0.5 rounded-full">
              {filteredAnalyses.length} Total Scans
            </span>
          </div>

          {topPlants.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No plant records available</p>
              <p className="text-[11px] text-slate-400">No plant scan data found for the selected report range.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topPlants.slice(0, 5).map((pl, idx) => {
                const pct = filteredAnalyses.length > 0 ? Math.round((pl.count / filteredAnalyses.length) * 100) : 0;
                return (
                  <div key={pl.name} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#222630] border border-slate-100 dark:border-[#3F4452]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{pl.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">{pl.count} scans</span>
                      <span className="text-[10px] font-mono text-slate-400">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Info Banner */}
      <div className="bg-[#EAF6E8]/70 dark:bg-[#132B1F] border border-[#16883D]/20 dark:border-[#22C55E]/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#063D24] dark:text-[#22C55E] font-semibold">
        <Info className="w-5 h-5 shrink-0" />
        <span>System telemetry reports update dynamically from Firebase Firestore data. Administrator accounts are excluded from normal user analytics.</span>
      </div>

    </div>
  );
};
