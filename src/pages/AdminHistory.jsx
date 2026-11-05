import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Info, 
  Eye, 
  X, 
  ChevronDown, 
  Calendar, 
  User, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  Bug, 
  FlaskConical, 
  Sprout, 
  CheckCircle2, 
  Image as ImageIcon,
  Hash,
  Activity
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

// Safe date formatter - NEVER outputs "Invalid Date"
const formatSafeDate = (rawVal) => {
  const d = toSafeDate(rawVal);
  if (!d) return 'Date unavailable';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
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

// Result / Problem Detected resolution for table
const getAnalysisResultSummary = (item, typeName) => {
  if (typeName === 'Disease Detection') {
    return item.diseaseName || item.disease || item.healthStatus || item.details || (item.diseaseDetected ? 'Disease Detected' : 'Healthy Specimen');
  }
  if (typeName === 'Pest Detection') {
    return item.pestName || item.pestResult || item.details || 'Pest Identified';
  }
  if (typeName === 'Nutrient Deficiency') {
    return item.primaryNutrient || item.title || item.nutritionStatus || item.details || 'Nutrient Deficiency';
  }
  // Plant Identification
  return item.plantName || item.scientificName || item.title || 'Plant Identified';
};

// Date range check
const isWithinDateRange = (itemDate, range) => {
  if (range === 'All Time') return true;
  const d = toSafeDate(itemDate);
  if (!d) return false;

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 3600 * 24);

  if (range === 'Today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'Last 7 Days') {
    return diffDays <= 7;
  }
  if (range === 'Last 30 Days') {
    return diffDays <= 30;
  }
  return true;
};

export const AdminHistory = () => {
  const [records, setRecords] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [analysisTypeFilter, setAnalysisTypeFilter] = useState('All Types');
  const [dateRangeFilter, setDateRangeFilter] = useState('All Time');

  // Modal View state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Listen to Firestore 'users' and 'analysisHistory'
  useEffect(() => {
    let unsubs = [];
    setLoading(true);
    setError(null);

    try {
      // 1. Listen to users collection for name/email resolution
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const uMap = {};
        snap.docs.forEach(docSnap => {
          uMap[docSnap.id] = docSnap.data();
        });
        setUsersMap(uMap);
      }, (err) => console.warn("Users map listener warning:", err));
      unsubs.push(unsubUsers);

      // 2. Listen to analysisHistory collection
      const unsubHistory = onSnapshot(collection(db, 'analysisHistory'), (snap) => {
        const loadedDocs = snap.docs.map(docSnap => ({
          analysisId: docSnap.id,
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Filter ONLY actual AI analysis records (exclude irrigation/watering logs)
        const validAiRecords = loadedDocs.filter(item => {
          const typeStr = (item.analysisType || item.type || '').toLowerCase();
          if (typeStr.includes('water') || typeStr.includes('irrigation') || typeStr.includes('activity')) {
            return false;
          }
          return true;
        });

        // Sort by timestamp desc (newest first)
        validAiRecords.sort((a, b) => {
          const dA = toSafeDate(a.timestamp || a.createdAt || a.date);
          const dB = toSafeDate(b.timestamp || b.createdAt || b.date);
          const tA = dA ? dA.getTime() : 0;
          const tB = dB ? dB.getTime() : 0;
          return tB - tA;
        });

        setRecords(validAiRecords);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching analysis history from Firestore:", err);
        setError("Failed to load global analysis history records.");
        setLoading(false);
      });
      unsubs.push(unsubHistory);

    } catch (err) {
      console.error("Firestore initialization error:", err);
      setError("Failed to connect to Firebase Firestore.");
      setLoading(false);
    }

    return () => {
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, []);

  // Resolve user info helper
  const resolveUser = (userId, item) => {
    if (userId && usersMap[userId]) {
      const u = usersMap[userId];
      return {
        name: u.fullName || u.displayName || u.name || 'Registered User',
        email: u.email || 'N/A'
      };
    }
    if (item?.userName || item?.userEmail) {
      return {
        name: item.userName || item.userEmail?.split('@')[0] || 'Registered User',
        email: item.userEmail || 'N/A'
      };
    }
    if (userId && typeof userId === 'string' && userId.length > 5) {
      if (userId.includes('@')) {
        return { name: userId.split('@')[0], email: userId };
      }
      return { name: `User (${userId.slice(0, 6)})`, email: 'N/A' };
    }
    return { name: 'Registered User', email: 'N/A' };
  };

  // Filtered records computation
  const filteredRecords = records.filter(item => {
    const normType = getNormalizedAnalysisType(item);
    const resultSummary = getAnalysisResultSummary(item, normType);
    const user = resolveUser(item.userId, item);

    // Type filter
    if (analysisTypeFilter !== 'All Types' && normType !== analysisTypeFilter) {
      return false;
    }

    // Date range filter
    if (!isWithinDateRange(item.timestamp || item.createdAt || item.date, dateRangeFilter)) {
      return false;
    }

    // Search term matching
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    const matchesSearch = 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (item.plantName || '').toLowerCase().includes(searchLower) ||
      normType.toLowerCase().includes(searchLower) ||
      resultSummary.toLowerCase().includes(searchLower) ||
      (item.analysisId || item.id || '').toLowerCase().includes(searchLower);

    return matchesSearch;
  });

  // Open View Result modal
  const handleOpenView = (record) => {
    setSelectedRecord(record);
    setViewModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 select-none transition-colors duration-300">
      
      {/* Top Header Row */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-[#16883D] dark:text-[#22C55E] tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 stroke-[2.5]" />
          <span>Analysis History</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Comprehensive global log of all user plant identifications and health diagnostic records.
        </p>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Card */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-5 border border-slate-100 dark:border-[#2A2E36] shadow-sm transition-colors duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          
          {/* Search Input */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Search History
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, plant, type, result, ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              />
            </div>
          </div>

          {/* Analysis Type Filter Dropdown */}
          <div className="sm:col-span-4 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Analysis Type
            </label>
            <div className="relative">
              <select
                value={analysisTypeFilter}
                onChange={(e) => setAnalysisTypeFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All Types">All Analysis Types</option>
                <option value="Plant Identification">Plant Identification</option>
                <option value="Disease Detection">Disease Detection</option>
                <option value="Nutrient Deficiency">Nutrient Deficiency</option>
                <option value="Pest Detection">Pest Detection</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Date Range Filter Dropdown */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Date Range
            </label>
            <div className="relative">
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All Time">All Time</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
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
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Analysis Type</th>
                <th className="py-3 px-4">Plant Name</th>
                <th className="py-3 px-4">Result / Diagnosis</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status / Severity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#16883D] dark:text-[#22C55E] animate-spin" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Loading global analysis history from Firebase...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shadow-sm">
                        <History className="w-8 h-8 stroke-[2]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          No history records found
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {searchTerm || analysisTypeFilter !== 'All Types' || dateRangeFilter !== 'All Time'
                            ? "No analysis records match your search and filter criteria."
                            : "Analysis history records will appear here as users scan plants."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, idx) => {
                  const normType = getNormalizedAnalysisType(item);
                  const resultSummary = getAnalysisResultSummary(item, normType);
                  const user = resolveUser(item.userId, item);
                  const formattedDate = formatSafeDate(item.timestamp || item.createdAt || item.date);
                  const confidenceVal = item.confidence !== undefined ? `${item.confidence}%` : 'N/A';
                  const severityOrStatus = item.severity || item.healthStatus || item.status || 'Normal';

                  return (
                    <tr key={item.analysisId || idx} className="border-t border-slate-100 dark:border-[#2A2E36] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block">{user.name}</span>
                          <span className="text-[10px] text-slate-400 block">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          normType === 'Disease Detection' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' :
                          normType === 'Nutrient Deficiency' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' :
                          normType === 'Pest Detection' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' :
                          'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {normType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                        {item.plantName || item.diseaseName || 'Analyzed Specimen'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium max-w-xs truncate">
                        {resultSummary}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {confidenceVal}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {severityOrStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => handleOpenView(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#EAF6E8] dark:bg-[#132B1F] hover:bg-[#d8edd4] dark:hover:bg-[#1b3d2b] text-[#16883D] dark:text-[#22C55E] text-xs font-bold transition-all flex items-center justify-end gap-1 ml-auto shrink-0"
                          title="View Result Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Result</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Bottom Info Banner */}
      <div className="bg-[#EAF6E8]/70 dark:bg-[#132B1F] border border-[#16883D]/20 dark:border-[#22C55E]/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#063D24] dark:text-[#22C55E] font-semibold">
        <Info className="w-5 h-5 shrink-0" />
        <span>System logs retain all plant diagnostics globally across users for administrative review and botanical analytics.</span>
      </div>

      {/* VIEW RESULT DETAILS READ-ONLY MODAL */}
      {viewModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-6 my-8">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setViewModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                  {getNormalizedAnalysisType(selectedRecord)}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {selectedRecord.plantName || selectedRecord.diseaseName || 'Analysis Record'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Scanned on {formatSafeDate(selectedRecord.timestamp || selectedRecord.createdAt || selectedRecord.date)}
              </p>
            </div>

            {/* User Details & Image Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-[#222630] rounded-2xl p-4 border border-slate-200 dark:border-[#3F4452]">
              
              {/* Image Preview */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                {selectedRecord.imageData || selectedRecord.imageUrl ? (
                  <img 
                    src={selectedRecord.imageData || selectedRecord.imageUrl} 
                    alt="Analyzed Specimen"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-full h-36 rounded-xl bg-slate-200/60 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-4 text-center space-y-1.5">
                    <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                    <span className="text-[11px] font-semibold">Original image unavailable</span>
                  </div>
                )}
              </div>

              {/* Owner & Confidence details */}
              <div className="sm:col-span-7 space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Analysis Owner</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {resolveUser(selectedRecord.userId, selectedRecord).name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {resolveUser(selectedRecord.userId, selectedRecord).email}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-slate-200 dark:border-[#3F4452]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Confidence Score</span>
                    <span className="text-xs font-mono font-black text-[#16883D] dark:text-[#22C55E]">
                      {selectedRecord.confidence !== undefined ? `${selectedRecord.confidence}% match` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Severity / Status</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {selectedRecord.severity || selectedRecord.healthStatus || selectedRecord.status || 'Normal'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Diagnostic Details Grid */}
            <div className="space-y-3 bg-slate-50 dark:bg-[#222630] rounded-2xl p-4 border border-slate-200 dark:border-[#3F4452]">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Plant Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedRecord.plantName || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Scientific Name</span>
                  <span className="italic text-slate-700 dark:text-slate-300 font-medium">
                    {selectedRecord.scientificName || 'N/A'}
                  </span>
                </div>

                {selectedRecord.diseaseName && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Disease Identified</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {selectedRecord.diseaseName}
                    </span>
                  </div>
                )}

                {selectedRecord.primaryNutrient && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Primary Deficiency</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {selectedRecord.primaryNutrient}
                    </span>
                  </div>
                )}

                {selectedRecord.pestName && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Pest Identified</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {selectedRecord.pestName}
                    </span>
                  </div>
                )}

                {selectedRecord.affectedPart && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Affected Specimen Part</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecord.affectedPart}
                    </span>
                  </div>
                )}
              </div>

              {/* Symptoms / Details */}
              {(selectedRecord.details || selectedRecord.analysisSummary || (selectedRecord.symptoms && selectedRecord.symptoms.length > 0)) && (
                <div className="pt-2 border-t border-slate-200 dark:border-[#3F4452] space-y-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Analysis Summary & Details</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {selectedRecord.details || selectedRecord.analysisSummary || (Array.isArray(selectedRecord.symptoms) ? selectedRecord.symptoms.join(', ') : selectedRecord.symptoms)}
                  </p>
                </div>
              )}

            </div>

            {/* Read-Only Modal Action Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
