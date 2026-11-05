import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Bug, 
  Users, 
  BarChart2, 
  PieChart, 
  Folder, 
  ShieldAlert, 
  Activity, 
  Loader2, 
  AlertCircle,
  Eye,
  X,
  Image as ImageIcon,
  Stethoscope,
  Zap,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Safe Date Converter
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

// Safe date formatter
const formatSafeDate = (rawVal) => {
  const d = toSafeDate(rawVal);
  if (!d) return 'Not available';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// Helper to render array lists or single string paragraphs
const renderListOrText = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    const filtered = data.filter(Boolean);
    if (filtered.length === 0) return null;
    return (
      <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 font-medium pl-1">
        {filtered.map((item, idx) => (
          <li key={idx}>{String(item)}</li>
        ))}
      </ul>
    );
  }
  const str = String(data).trim();
  if (!str) return null;
  return <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{str}</p>;
};

// User Resolution Helper
const resolveUser = (item, usersMap) => {
  if (!item) return { name: 'User', email: 'Not available' };

  const candidateIds = [
    item.userId,
    item.uid,
    item.user_id,
    item.ownerId,
    item.owner_id,
    item.userEmail,
    item.email
  ].filter(Boolean);

  for (const rawId of candidateIds) {
    const key = String(rawId).trim();
    const matched = usersMap[key] || usersMap[key.toLowerCase()];
    if (matched) {
      const name = matched.fullName || matched.displayName || matched.name || matched.username || matched.email;
      const email = matched.email || item.userEmail || item.email || 'Not available';
      return { name, email };
    }
  }

  const rawId = item.userId || item.uid || item.user_id || '';
  const name = item.userName || item.name || (item.userEmail ? item.userEmail.split('@')[0] : null) || (item.email ? item.email.split('@')[0] : null) || (rawId ? `User (${String(rawId).slice(0, 6)})` : 'User');
  const email = item.userEmail || item.email || 'Not available';

  return { name, email };
};

// Image Resolution Helper
const resolveImage = (item, plantsMap) => {
  if (!item) return null;

  const directImage = 
    item.imageData || 
    item.imageUrl || 
    item.image || 
    item.photo || 
    item.photoUrl || 
    item.picture || 
    item.file || 
    item.preview || 
    item.image_url || 
    item.image_data || 
    item.specimenImage || 
    item.plantImage;

  if (directImage && typeof directImage === 'string' && directImage.trim() !== '') {
    return directImage;
  }

  const plantNameKey = (item.plantName || item.title || '').toLowerCase().trim();
  const plantIdKey = (item.plantId || '').trim();

  if (plantIdKey && plantsMap[plantIdKey]) {
    const p = plantsMap[plantIdKey];
    const pImg = p.image || p.imageUrl || p.imageData;
    if (pImg) return pImg;
  }

  if (plantNameKey && plantsMap[plantNameKey]) {
    const p = plantsMap[plantNameKey];
    const pImg = p.image || p.imageUrl || p.imageData;
    if (pImg) return pImg;
  }

  return null;
};

// Plant Name Resolution Helper
const resolvePlantName = (item, plantsMap) => {
  if (!item) return 'Plant not recorded';

  const isFakeName = (str) => {
    if (!str) return true;
    const l = str.toLowerCase().trim();
    return l.includes('specimen') || l.includes('unknown plant') || l.includes('detected plant') || l === 'garden plant';
  };

  // 1. Check direct fields on document
  if (item.plantName && typeof item.plantName === 'string' && item.plantName.trim() && !isFakeName(item.plantName)) {
    return item.plantName.trim();
  }
  if (item.name && typeof item.name === 'string' && item.name.trim() && !isFakeName(item.name)) {
    return item.name.trim();
  }

  // 2. Check plantsMap by plantId
  if (item.plantId && plantsMap[item.plantId]) {
    const p = plantsMap[item.plantId];
    if (p.name && !isFakeName(p.name)) return p.name;
  }

  // 3. Historical records with no recorded plant name
  return 'Plant not recorded';
};

// Scientific Name Resolution Helper
const resolveScientificName = (item, plantsMap) => {
  if (!item) return null;

  const directScientific = 
    item.scientificName || 
    item.plantScientificName || 
    item.species || 
    item.botanicalName || 
    item.latinName;

  if (directScientific && typeof directScientific === 'string' && directScientific.trim() !== '') {
    return directScientific;
  }

  const plantNameKey = (item.plantName || item.title || '').toLowerCase().trim();
  const plantIdKey = (item.plantId || '').trim();

  if (plantIdKey && plantsMap[plantIdKey]) {
    const p = plantsMap[plantIdKey];
    const pSci = p.scientificName || p.species || p.botanicalName;
    if (pSci) return pSci;
  }

  if (plantNameKey && plantsMap[plantNameKey]) {
    const p = plantsMap[plantNameKey];
    const pSci = p.scientificName || p.species || p.botanicalName;
    if (pSci) return pSci;
  }

  return null;
};

export const AdminDashboard = () => {
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firestore live metrics
  const [plantsCount, setPlantsCount] = useState(0);
  const [diseasesCount, setDiseasesCount] = useState(0);
  const [pestsCount, setPestsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);

  // Data lists & lookup maps
  const [usersMap, setUsersMap] = useState({});
  const [plantsMap, setPlantsMap] = useState({});
  const [analysesList, setAnalysesList] = useState([]);

  // View modal state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [selectedRecord]);

  useEffect(() => {
    let unsubs = [];
    setLoading(true);
    setError(null);

    try {
      // 1. Listen to 'plants' collection
      const unsubPlants = onSnapshot(collection(db, 'plants'), (snap) => {
        setPlantsCount(snap.size);

        const pMap = {};
        snap.docs.forEach(doc => {
          const data = doc.data();
          pMap[doc.id] = data;
          if (data.name) {
            pMap[data.name.toLowerCase().trim()] = data;
          }
          if (data.species) {
            pMap[data.species.toLowerCase().trim()] = data;
          }
        });
        setPlantsMap(pMap);
      }, (err) => console.warn("Plants listener warning:", err));
      unsubs.push(unsubPlants);

      // 2. Listen to 'diseases' collection
      const unsubDiseases = onSnapshot(collection(db, 'diseases'), (snap) => {
        setDiseasesCount(snap.size);
      }, (err) => console.warn("Diseases listener warning:", err));
      unsubs.push(unsubDiseases);

      // 3. Listen to 'pests' collection
      const unsubPests = onSnapshot(collection(db, 'pests'), (snap) => {
        setPestsCount(snap.size);
      }, (err) => console.warn("Pests listener warning:", err));
      unsubs.push(unsubPests);

      // 4. Listen to 'users' collection
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const uMap = {};
        let registeredRegularCount = 0;

        const currentAdminUid = currentUser?.uid;
        const currentAdminEmail = (currentUser?.email || '').toLowerCase();

        snap.docs.forEach((d) => {
          const uData = d.data();
          const docId = d.id;
          const uid = uData.uid || uData.userId || docId;
          const email = uData.email || uData.userEmail;

          if (docId) uMap[docId] = uData;
          if (docId) uMap[docId.toLowerCase()] = uData;
          if (uid) uMap[String(uid)] = uData;
          if (uid) uMap[String(uid).toLowerCase()] = uData;
          if (email) uMap[String(email).toLowerCase()] = uData;

          // Check if admin user
          const uRole = (uData.role || '').toLowerCase();
          const uEmailStr = (email || '').toLowerCase();
          const isAdmin = uRole === 'admin' || 
                          uEmailStr.includes('admin') || 
                          (currentAdminUid && (docId === currentAdminUid || uid === currentAdminUid)) ||
                          (currentAdminEmail && uEmailStr === currentAdminEmail);

          if (!isAdmin) {
            registeredRegularCount++;
          }
        });

        setUsersMap(uMap);
        setUsersCount(registeredRegularCount);
      }, (err) => console.warn("Users listener warning:", err));
      unsubs.push(unsubUsers);

      // 5. Listen to 'analysisHistory' collection
      const unsubAnalyses = onSnapshot(collection(db, 'analysisHistory'), (snap) => {
        const records = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter ONLY actual AI analysis records (exclude irrigation/watering logs)
        const validAiRecords = records.filter(item => {
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

        setAnalysesList(validAiRecords);
        setLoading(false);
      }, (err) => {
        console.error("AnalysisHistory listener error:", err);
        setError("Failed to load analysis history from Firestore.");
        setLoading(false);
      });
      unsubs.push(unsubAnalyses);

    } catch (err) {
      console.error("Firestore initialization error:", err);
      setError("Failed to connect to Firebase Firestore.");
      setLoading(false);
    }

    return () => {
      unsubs.forEach(unsub => unsub && unsub());
    };
  }, [currentUser]);

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
      return item.pestName || item.primaryPest || item.pestResult || item.details || 'Pest Identified';
    }
    if (typeName === 'Nutrient Deficiency') {
      return item.primaryNutrient || item.title || item.nutritionStatus || item.details || 'Nutrient Deficiency';
    }
    // Plant Identification
    return item.plantName || item.scientificName || item.title || 'Plant Identified';
  };

  // Calculate Analysis Breakdown counts for "Analysis by Type"
  const typeCounts = {
    'Plant Identification': 0,
    'Disease Detection': 0,
    'Nutrient Deficiency': 0,
    'Pest Detection': 0
  };

  analysesList.forEach(item => {
    const normType = getNormalizedAnalysisType(item);
    if (typeCounts[normType] !== undefined) {
      typeCounts[normType]++;
    } else {
      typeCounts['Plant Identification']++;
    }
  });

  const totalAnalysesCount = analysesList.length;

  // Group analyses by Date for "Analysis Overview" Timeline Chart
  const timelineGroupMap = {};
  analysesList.forEach(item => {
    const d = toSafeDate(item.timestamp || item.createdAt || item.date);
    if (d) {
      const dateKey = `${d.getDate()}/${d.getMonth() + 1}`;
      timelineGroupMap[dateKey] = (timelineGroupMap[dateKey] || 0) + 1;
    }
  });

  const timelineKeys = Object.keys(timelineGroupMap).slice(-7); // Last 7 active days
  const maxTimelineVal = Math.max(...Object.values(timelineGroupMap), 1);

  // Recent 10 analyses for table
  const recentAnalyses = analysesList.slice(0, 10);

  // Active modal resolved values
  const activeImage = selectedRecord ? resolveImage(selectedRecord, plantsMap) : null;
  const activeUser = selectedRecord ? resolveUser(selectedRecord, usersMap) : { name: 'User', email: 'Not available' };
  const activePlantName = selectedRecord ? resolvePlantName(selectedRecord, plantsMap) : 'Garden Plant';
  const activeScientific = selectedRecord ? resolveScientificName(selectedRecord, plantsMap) : null;
  const activeType = selectedRecord ? getNormalizedAnalysisType(selectedRecord) : '';

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 select-none transition-colors duration-300">
      
      {/* Dashboard Title & Subtitle */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-[#16883D] dark:text-[#22C55E] tracking-tight">
          Dashboard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Welcome to the admin dashboard. Here you can manage system data and monitor overall activity.
        </p>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Metrics Row: 5 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Plants */}
        <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
            <Sprout className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Plants</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#16883D]" /> : plantsCount}
            </div>
          </div>
        </div>

        {/* Total Diseases */}
        <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Diseases</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-red-500" /> : diseasesCount}
            </div>
          </div>
        </div>

        {/* Total Pests */}
        <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Bug className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Pests</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-amber-600" /> : pestsCount}
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Users</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : usersCount}
            </div>
          </div>
        </div>

        {/* Total Analyses Statistic */}
        <div className="bg-white dark:bg-[#1A1D23] p-5 rounded-2xl border border-slate-100 dark:border-[#2A2E36] shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Total Analyses</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : totalAnalysesCount}
            </div>
          </div>
        </div>

      </div>

      {/* Middle Row: 2 Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Analysis Overview */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Analysis Overview</h3>
            {totalAnalysesCount > 0 && (
              <span className="text-[10px] font-bold text-[#16883D] dark:text-[#22C55E] bg-[#EAF6E8] dark:bg-[#132B1F] px-2.5 py-1 rounded-full">
                {totalAnalysesCount} AI scans
              </span>
            )}
          </div>

          {loading ? (
            <div className="min-h-[180px] flex flex-col items-center justify-center space-y-3 py-6">
              <Loader2 className="w-7 h-7 text-[#16883D] dark:text-[#22C55E] animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading analysis timeline...</p>
            </div>
          ) : totalAnalysesCount === 0 || timelineKeys.length === 0 ? (
            <div className="min-h-[180px] flex flex-col items-center justify-center text-center space-y-3 py-6">
              <div className="w-14 h-14 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                <BarChart2 className="w-7 h-7 stroke-[2]" />
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">No data available</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Analysis data will appear here once available.</p>
              </div>
            </div>
          ) : (
            <div className="min-h-[180px] pt-4 pb-2 flex flex-col justify-end space-y-3">
              {/* Bar Chart Visualization */}
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
            </div>
          )}
        </div>

        {/* Analysis by Type */}
        <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Analysis by Type</h3>
            {totalAnalysesCount > 0 && (
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                4 Categories
              </span>
            )}
          </div>

          {loading ? (
            <div className="min-h-[180px] flex flex-col items-center justify-center space-y-3 py-6">
              <Loader2 className="w-7 h-7 text-[#16883D] dark:text-[#22C55E] animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Loading analysis types...</p>
            </div>
          ) : totalAnalysesCount === 0 ? (
            <div className="min-h-[180px] flex flex-col items-center justify-center text-center space-y-3 py-6">
              <div className="w-14 h-14 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                <PieChart className="w-7 h-7 stroke-[2]" />
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">No data available</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Analysis by type will appear here once available.</p>
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

      {/* Bottom Row: Recent Analyses Table Card */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 border border-slate-100 dark:border-[#2A2E36] shadow-sm space-y-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recent Analyses</h3>
          {recentAnalyses.length > 0 && (
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              Showing latest {recentAnalyses.length} of {totalAnalysesCount} records
            </span>
          )}
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-[#2A2E36]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#EAF6E8]/70 dark:bg-[#132B1F] text-[#063D24] dark:text-[#22C55E] font-bold">
              <tr>
                <th className="py-3 px-4">Sl. No.</th>
                <th className="py-3 px-4">Analysis Type</th>
                <th className="py-3 px-4">Plant Name</th>
                <th className="py-3 px-4">Result / Problem Detected</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#16883D] dark:text-[#22C55E] animate-spin" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Fetching recent analysis records from Firebase...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : recentAnalyses.length === 0 ? (
                /* Empty state inside table */
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                        <Folder className="w-7 h-7 stroke-[2]" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">No data available</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Recent analysis records will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                recentAnalyses.map((item, idx) => {
                  const normType = getNormalizedAnalysisType(item);
                  const resultText = getAnalysisResultSummary(item, normType);
                  const userObj = resolveUser(item, usersMap);
                  const plantNameStr = resolvePlantName(item, plantsMap);
                  const dateStr = formatSafeDate(item.timestamp || item.createdAt || item.date);
                  const statusVal = item.status || item.healthStatus || item.pestStatus || item.nutritionStatus || 'Completed';

                  return (
                    <tr key={item.id || idx} className="border-t border-slate-100 dark:border-[#2A2E36] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          normType === 'Disease Detection' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' :
                          normType === 'Nutrient Deficiency' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' :
                          normType === 'Pest Detection' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' :
                          'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {normType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">
                        {plantNameStr}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium max-w-xs truncate">
                        {resultText}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {userObj.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {statusVal}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedRecord(item);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#16883D] hover:text-white dark:hover:bg-[#16883D] text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
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

      {/* View Analysis Details Modal */}
      {viewModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-[#2A2E36] space-y-5 max-h-[90vh] overflow-y-auto select-text">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {selectedRecord.title || (selectedRecord.primaryPest ? `Pest Scan: ${selectedRecord.primaryPest}` : selectedRecord.diseaseName ? `Disease Scan: ${selectedRecord.diseaseName}` : selectedRecord.primaryNutrient ? `Nutrient Scan: ${selectedRecord.primaryNutrient}` : activePlantName)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Scanned on {formatSafeDate(selectedRecord.timestamp || selectedRecord.createdAt || selectedRecord.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image & Key Information Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-[#222630] rounded-2xl p-4 border border-slate-200/60 dark:border-[#3F4452]">
              
              {/* Specimen Image Preview */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center">
                {activeImage && !imgFailed ? (
                  <img 
                    src={activeImage} 
                    alt="Analyzed Plant Specimen"
                    onError={() => setImgFailed(true)}
                    className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-full h-40 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 p-4 text-center space-y-1.5">
                    <ImageIcon className="w-8 h-8 stroke-[1.5] text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Specimen image preview</span>
                  </div>
                )}
              </div>

              {/* Specimen Metadata & User Details */}
              <div className="sm:col-span-7 space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Analysis Category</span>
                  <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeType === 'Disease Detection' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' :
                    activeType === 'Nutrient Deficiency' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' :
                    activeType === 'Pest Detection' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' :
                    'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {activeType}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Analysis Owner (User)</span>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {activeUser.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {activeUser.email}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-1.5 border-t border-slate-200 dark:border-[#3F4452]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">AI Match Confidence</span>
                    <span className="text-xs font-mono font-black text-[#16883D] dark:text-[#22C55E]">
                      {selectedRecord.confidence !== undefined ? `${selectedRecord.confidence}% match` : 'Not available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Severity / Status</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {selectedRecord.severity || selectedRecord.pestStatus || selectedRecord.healthStatus || selectedRecord.nutritionStatus || selectedRecord.status || 'Normal'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Structured Gemini AI Diagnostic Details */}
            <div className="space-y-4 bg-slate-50 dark:bg-[#222630] rounded-2xl p-4 border border-slate-200/60 dark:border-[#3F4452] text-xs">
              
              {/* Core Properties Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200/60 dark:border-[#3F4452]">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Plant Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {activePlantName}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Scientific Name</span>
                  <span className="italic text-slate-700 dark:text-slate-300 font-medium">
                    {activeScientific || 'Not available'}
                  </span>
                </div>

                {/* Category-specific Result Field */}
                {activeType === 'Disease Detection' && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Diagnosed Condition</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {selectedRecord.diseaseName || selectedRecord.disease || selectedRecord.healthStatus || 'Disease Detected'}
                    </span>
                  </div>
                )}

                {activeType === 'Nutrient Deficiency' && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Detected Nutrient Deficiency</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {selectedRecord.primaryNutrient || selectedRecord.nutritionStatus || 'Nutrient Deficiency'} {selectedRecord.nutrientSymbol ? `(${selectedRecord.nutrientSymbol})` : ''}
                    </span>
                  </div>
                )}

                {activeType === 'Pest Detection' && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Pest Identified</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {selectedRecord.primaryPest || selectedRecord.pestName || selectedRecord.pestResult || 'Pest Identified'}
                    </span>
                  </div>
                )}

                {selectedRecord.family && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Plant Family</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecord.family}
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

                {(selectedRecord.category || selectedRecord.plantCategory) && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Plant Category</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedRecord.category || selectedRecord.plantCategory}
                    </span>
                  </div>
                )}
              </div>

              {/* Plant Identification Specific: Common Names */}
              {activeType === 'Plant Identification' && selectedRecord.commonNames && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#16883D] dark:text-[#22C55E] uppercase block">Common Names</span>
                  {renderListOrText(selectedRecord.commonNames)}
                </div>
              )}

              {/* Plant Identification Specific: Description */}
              {activeType === 'Plant Identification' && selectedRecord.description && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Plant Description</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{selectedRecord.description}</p>
                </div>
              )}

              {/* Plant Identification Specific: Uses */}
              {activeType === 'Plant Identification' && selectedRecord.uses && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Uses & Applications</span>
                  {renderListOrText(selectedRecord.uses)}
                </div>
              )}

              {/* Plant Identification Specific: Care Instructions */}
              {activeType === 'Plant Identification' && (selectedRecord.careInstructions || selectedRecord.careSummary) && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Care Instructions</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{selectedRecord.careInstructions || selectedRecord.careSummary}</p>
                </div>
              )}

              {/* Symptoms (Disease, Pest, Nutrient) */}
              {activeType !== 'Plant Identification' && selectedRecord.symptoms && (Array.isArray(selectedRecord.symptoms) ? selectedRecord.symptoms.length > 0 : Boolean(selectedRecord.symptoms)) && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#16883D] dark:text-[#22C55E] uppercase block flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    Symptoms & Damage Detected
                  </span>
                  {renderListOrText(selectedRecord.symptoms)}
                </div>
              )}

              {/* Possible Cause */}
              {selectedRecord.possibleCause && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Possible Cause</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {selectedRecord.possibleCause}
                  </p>
                </div>
              )}

              {/* Treatment Recommendations */}
              {(selectedRecord.treatmentRecommendations || selectedRecord.recommendedTreatment || selectedRecord.treatment) && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Treatment Recommendations
                  </span>
                  {renderListOrText(selectedRecord.treatmentRecommendations || selectedRecord.recommendedTreatment || selectedRecord.treatment)}
                </div>
              )}

              {/* Organic / Biological Control (Pest Detection) */}
              {selectedRecord.organicControl && (Array.isArray(selectedRecord.organicControl) ? selectedRecord.organicControl.length > 0 : Boolean(selectedRecord.organicControl)) && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase block">
                    Organic & Biological Control
                  </span>
                  {renderListOrText(selectedRecord.organicControl)}
                </div>
              )}

              {/* Fertilizer & Nutrition Recommendations */}
              {(selectedRecord.fertilizerRecommendations || selectedRecord.fertilizerRecommendation) && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase block flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Fertilizer & Nutrition Suggestions
                  </span>
                  {renderListOrText(selectedRecord.fertilizerRecommendations || selectedRecord.fertilizerRecommendation)}
                </div>
              )}

              {/* Prevention & Future Care */}
              {(selectedRecord.preventionSuggestions || selectedRecord.prevention) && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase block">
                    Prevention & Future Care
                  </span>
                  {renderListOrText(selectedRecord.preventionSuggestions || selectedRecord.prevention)}
                </div>
              )}

              {/* Plant Care / Environmental Suggestions */}
              {selectedRecord.plantCareSuggestions && (Array.isArray(selectedRecord.plantCareSuggestions) ? selectedRecord.plantCareSuggestions.length > 0 : Boolean(selectedRecord.plantCareSuggestions)) && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Plant Care Suggestions</span>
                  {renderListOrText(selectedRecord.plantCareSuggestions)}
                </div>
              )}

              {/* Analysis Summary / Details */}
              {(selectedRecord.analysisSummary || selectedRecord.details) && (
                <div className="space-y-1 pt-2 border-t border-slate-200/60 dark:border-[#3F4452]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Full Analysis Summary</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {selectedRecord.analysisSummary || selectedRecord.details}
                  </p>
                </div>
              )}

            </div>

            {/* Modal Actions */}
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
