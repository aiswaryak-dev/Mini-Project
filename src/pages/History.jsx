import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Search, Calendar, ClipboardList, Info, Sparkles, X, Activity, Stethoscope, FlaskConical, Target, Zap, TrendingUp } from 'lucide-react';
import { usePlants } from '../context/PlantContext';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

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
    const milliseconds = value < 10000000000 ? value * 1000 : value;
    const d = new Date(milliseconds);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

// Safe date formatter - NEVER outputs "Invalid Date"
const formatRecordDate = (log) => {
  if (!log) return "Date unavailable";
  const rawVal = log.timestamp || log.createdAt || log.date;
  const d = toSafeDate(rawVal);
  if (d) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  return "Date unavailable";
};

export const History = () => {
  const navigate = useNavigate();
  const { activityLogs } = usePlants();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All Types');
  const [dateRange, setDateRange] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [historyDocs, setHistoryDocs] = useState([]);

  useEffect(() => {
    const activeUid = auth?.currentUser?.uid || (!currentUser?.isDemo ? currentUser?.uid : null);
    if (!activeUid) {
      const localAnalyses = (activityLogs || []).filter(isAnalysisRecord);
      setHistoryDocs(localAnalyses);
      return;
    }

    let unsubHistory = () => {};
    let unsubIdent = () => {};

    let historyRecords = [];
    let identRecords = [];

    const mergeAndSet = () => {
      const combined = [...historyRecords, ...identRecords];
      const unique = new Map();
      combined.forEach(item => {
        if (item && item.id && !unique.has(item.id)) {
          unique.set(item.id, item);
        }
      });
      setHistoryDocs(Array.from(unique.values()));
    };

    try {
      const historyRef = collection(db, "analysisHistory");
      const q = query(historyRef, where("userId", "==", activeUid));
      unsubHistory = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          historyRecords = snap.docs.map(docSnap => ({
            analysisId: docSnap.id,
            id: docSnap.id,
            ...docSnap.data()
          }));
        } else {
          historyRecords = [];
        }
        mergeAndSet();
      }, (err) => {
        console.warn("Could not load analysisHistory via onSnapshot:", err);
      });
    } catch (e) {
      console.warn("Error subscribing to analysisHistory:", e);
    }

    try {
      const identRef = collection(db, "plant_identifications");
      const qIdent = query(identRef, where("userId", "==", activeUid));
      unsubIdent = onSnapshot(qIdent, (snap) => {
        if (!snap.empty) {
          identRecords = snap.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              analysisId: docSnap.id,
              id: docSnap.id,
              type: data.type || "identification",
              analysisType: data.analysisType || "Plant Identification",
              title: data.title || `Plant Identified: ${data.plantName || data.name || 'Plant'}`,
              ...data
            };
          });
        } else {
          identRecords = [];
        }
        mergeAndSet();
      }, (err) => {
        console.warn("plant_identifications query notice:", err?.message);
      });
    } catch (e) {
      console.warn("Error subscribing to plant_identifications:", e);
    }

    return () => {
      unsubHistory();
      unsubIdent();
    };
  }, [currentUser]);

  // Helper to check if a record is a genuine plant analysis (excluding irrigation/activity logs)
  const isAnalysisRecord = (item) => {
    if (!item) return false;

    const itemType = (item.type || item.analysisType || '').toLowerCase();

    // Inclusion criteria: Genuine plant analysis types
    const validTypes = [
      'disease', 'disease detection', 'disease scan',
      'nutrient', 'nutrient deficiency detection', 'nutrient scan', 'nutrient deficiency',
      'pest', 'pest detection', 'pest scan',
      'plant_identification', 'identification', 'plant identification'
    ];

    const hasValidType = validTypes.includes(itemType) || 
                         validTypes.includes((item.analysisType || '').toLowerCase()) ||
                         validTypes.includes((item.type || '').toLowerCase());

    // Explicit exclusion of irrigation / pump / watering / sensor activity logs
    if (['water', 'irrigation', 'pump', 'alert', 'system', 'activity'].includes(itemType)) {
      return false;
    }

    const title = (item.title || '').toLowerCase();
    const details = (item.details || '').toLowerCase();

    // Only exclude logs that are clearly irrigation/pump logs if it does not have an explicit analysis type
    if (!hasValidType) {
      if (
        title.includes('irrigation') || title.includes('pump') || title.includes('auto-dosed') ||
        details.includes('auto-dosed') || details.includes('irrigation') || details.includes('pump')
      ) {
        return false;
      }
    }

    const hasAnalysisFields = Boolean(
      item.diseaseName || item.primaryNutrient || item.primaryPest || item.scientificName ||
      item.healthStatus || item.nutritionStatus || item.pestStatus || item.plantName
    );

    return hasValidType || hasAnalysisFields;
  };

  const analysisLogs = historyDocs.filter(isAnalysisRecord);

  const uniqueMap = new Map();
  analysisLogs.forEach(item => {
    if (item && item.id && !uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  const safeLogs = Array.from(uniqueMap.values()).sort((a, b) => {
    const timeA = toSafeDate(a.timestamp || a.createdAt)?.getTime() || 0;
    const timeB = toSafeDate(b.timestamp || b.createdAt)?.getTime() || 0;
    return timeB - timeA;
  });

  const records = safeLogs.filter(log => {
    if (!log) return false;
    const queryStr = (search || '').toLowerCase();
    const titleMatch = (log.title || '').toLowerCase().includes(queryStr);
    const plantMatch = (log.plantName || '').toLowerCase().includes(queryStr);
    const scientificMatch = (log.scientificName || '').toLowerCase().includes(queryStr);
    const detailsMatch = (log.details || '').toLowerCase().includes(queryStr);
    const diseaseMatch = (log.diseaseName || '').toLowerCase().includes(queryStr);
    const nutrientMatch = (log.primaryNutrient || '').toLowerCase().includes(queryStr);
    const pestMatch = (log.primaryPest || '').toLowerCase().includes(queryStr);
    const matchesSearch = titleMatch || plantMatch || scientificMatch || detailsMatch || diseaseMatch || nutrientMatch || pestMatch;

    const logTypeLower = (log.type || '').toLowerCase();
    const logAnalysisTypeLower = (log.analysisType || '').toLowerCase();
    const filterTypeLower = (type || '').toLowerCase();

    let matchesType = !type || type === 'All Types';
    if (!matchesType) {
      if (filterTypeLower === 'plant identification' || filterTypeLower === 'plant_identification' || filterTypeLower === 'identification') {
        matchesType = logTypeLower === 'identification' || logTypeLower === 'plant_identification' || logAnalysisTypeLower === 'plant identification';
      } else if (filterTypeLower === 'disease detection' || filterTypeLower === 'disease') {
        matchesType = logTypeLower === 'disease' || logAnalysisTypeLower === 'disease detection';
      } else if (filterTypeLower === 'nutrient deficiency detection' || filterTypeLower === 'nutrient') {
        matchesType = logTypeLower === 'nutrient' || logAnalysisTypeLower === 'nutrient deficiency detection';
      } else if (filterTypeLower === 'pest detection' || filterTypeLower === 'pest') {
        matchesType = logTypeLower === 'pest' || logAnalysisTypeLower === 'pest detection';
      } else {
        matchesType = log.type === type || log.analysisType === type;
      }
    }

    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      
      {/* Header Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold text-[#063D24] flex items-center gap-2">
          Analysis History <HistoryIcon className="w-6 h-6 text-[#16883D]" />
        </h2>
        <p className="text-xs text-slate-500 font-medium max-w-3xl">
          View your previous plant analyses and track your plant's health, disease diagnostics, nutrient deficiencies, pest detections, and identification history. Click View Result on any entry to access detailed reports.
        </p>
      </div>

      {/* Top Filters Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          
          {/* Search Input */}
          <div className="sm:col-span-5 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by plant name, disease, nutrient, pest or type..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none text-[#063D24] font-medium"
              />
            </div>
          </div>

          {/* Analysis Type Dropdown */}
          <div className="sm:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Analysis Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none bg-white text-slate-700 font-medium"
            >
              <option value="All Types">All Types</option>
              <option value="Plant Identification">Plant Identification</option>
              <option value="Disease Detection">Disease Detection</option>
              <option value="Nutrient Deficiency Detection">Nutrient Deficiency Detection</option>
              <option value="Pest Detection">Pest Detection</option>
            </select>
          </div>

          {/* Date Range Input */}
          <div className="sm:col-span-3 space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              Date Range
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                placeholder="Select date range"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16883D] outline-none text-slate-700 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Box: Analysis Records */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        
        <h3 className="font-bold text-slate-900 text-sm">Analysis Records ({records.length})</h3>

        <div className="min-h-[220px]">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="w-16 h-16 rounded-full bg-[#EAF6E8] text-[#16883D] flex items-center justify-center">
                <ClipboardList className="w-8 h-8 stroke-[2]" />
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-base">No analysis records found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Your completed plant identification, disease detection, nutrient scan, and pest detection reports will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3 text-left">
              {records.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-300 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        {log.title && !log.title.includes('undefined') ? log.title : (log.plantName ? `Plant Identified: ${log.plantName}` : 'Plant Identification')}
                      </span>
                      {log.type === 'pest' || log.analysisType === 'Pest Detection' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Pest Detection
                        </span>
                      ) : log.type === 'nutrient' || log.analysisType === 'Nutrient Deficiency Detection' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#16883D] text-[10px] font-bold">
                          Nutrient Deficiency
                        </span>
                      ) : log.type === 'disease' || log.analysisType === 'Disease Detection' ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          Disease Detection
                        </span>
                      ) : (log.type === 'identification' || log.type === 'plant_identification' || log.analysisType === 'Plant Identification') ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#16883D] text-[10px] font-bold">
                          Identification
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-600">{log.details}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                      <span>{formatRecordDate(log)}</span>
                      {log.category && <span>Category: {log.category}</span>}
                      {log.confidence !== undefined && (log.type === 'identification' || log.analysisType === 'Plant Identification') && (
                        <span>Match: {log.confidence}%</span>
                      )}
                      {log.scientificName && (log.type === 'identification' || log.analysisType === 'Plant Identification') && (
                        <span className="italic">{log.scientificName}</span>
                      )}
                      {log.pestStatus && <span>Status: {log.pestStatus}</span>}
                      {log.nutritionStatus && <span>Status: {log.nutritionStatus}</span>}
                      {log.healthStatus && <span>Status: {log.healthStatus}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {(log.type === 'disease' || log.analysisType === 'Disease Detection') && (
                      <button 
                        onClick={() => navigate('/tracker', { state: { selectedId: log.id, analysisId: log.id } })}
                        className="px-3 py-2 rounded-xl bg-[#EAF6E8] text-[#16883D] hover:bg-emerald-100 font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Track Recovery</span>
                      </button>
                    )}
                    <button 
                      onClick={() => setSelectedRecord(log)}
                      className="px-3.5 py-2 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-sm active:scale-95"
                    >
                      View Result →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Detailed Result Report Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-100 relative animate-fadeIn my-8 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-[#16883D]">
              <Sparkles className="w-5 h-5" />
              <h4 className="font-extrabold text-base text-slate-900">
                {selectedRecord.title && !selectedRecord.title.includes('undefined')
                  ? selectedRecord.title
                  : (selectedRecord.plantName ? `Plant Identified: ${selectedRecord.plantName}` : (selectedRecord.scientificName ? `Plant Identified: ${selectedRecord.scientificName}` : 'Plant Identification'))}
              </h4>
            </div>

            {(selectedRecord.imageData || selectedRecord.imageUrl) && (
              <div className="h-44 w-full rounded-2xl overflow-hidden bg-slate-100">
                <img src={selectedRecord.imageData || selectedRecord.imageUrl} alt="Plant Specimen" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="space-y-3 text-xs text-slate-700 bg-emerald-50/80 p-4 rounded-2xl border border-emerald-100">
              
              {/* Plant Name and Scientific Name */}
              {selectedRecord.plantName && (
                <div><strong className="text-slate-900">Plant Name:</strong> <span className="font-bold text-slate-900">{selectedRecord.plantName}</span></div>
              )}
              {selectedRecord.scientificName && (
                <div><strong className="text-slate-900">Scientific Name:</strong> <span className="italic">{selectedRecord.scientificName}</span></div>
              )}
              {selectedRecord.family && (
                <div><strong className="text-slate-900">Family:</strong> {selectedRecord.family}</div>
              )}
              {selectedRecord.commonNames && (
                <div><strong className="text-slate-900">Common Names:</strong> {Array.isArray(selectedRecord.commonNames) ? selectedRecord.commonNames.join(', ') : selectedRecord.commonNames}</div>
              )}
              {selectedRecord.description && (
                <div className="pt-1"><strong className="text-slate-900 block mb-0.5 font-bold">Description:</strong> <p className="leading-relaxed">{selectedRecord.description}</p></div>
              )}
              {selectedRecord.uses && (Array.isArray(selectedRecord.uses) ? selectedRecord.uses.length > 0 : Boolean(selectedRecord.uses)) && (
                <div className="pt-1"><strong className="text-slate-900 block mb-0.5 font-bold">Uses & Applications:</strong> <p className="leading-relaxed">{Array.isArray(selectedRecord.uses) ? selectedRecord.uses.join(', ') : selectedRecord.uses}</p></div>
              )}
              {selectedRecord.careInstructions && (
                <div className="pt-1"><strong className="text-slate-900 block mb-0.5 font-bold">Care Instructions:</strong> <p className="leading-relaxed">{selectedRecord.careInstructions}</p></div>
              )}

              {/* Disease Detection specific fields */}
              {selectedRecord.diseaseName && (
                <div><strong className="text-slate-900">Diagnosed Condition:</strong> <span className="font-bold text-slate-900">{selectedRecord.diseaseName}</span></div>
              )}

              {/* Nutrient Deficiency specific fields */}
              {selectedRecord.primaryNutrient && (
                <div><strong className="text-slate-900">Detected Nutrient:</strong> <span className="font-bold text-[#16883D]">{selectedRecord.primaryNutrient} {selectedRecord.nutrientSymbol && `(${selectedRecord.nutrientSymbol})`}</span></div>
              )}

              {/* Pest Detection specific fields */}
              {selectedRecord.primaryPest && (
                <div><strong className="text-slate-900">Primary Pest:</strong> <span className="font-bold text-[#16883D]">{selectedRecord.primaryPest}</span></div>
              )}
              {selectedRecord.pestStatus && (
                <div><strong className="text-slate-900">Pest Status:</strong> <span className="font-bold">{selectedRecord.pestStatus}</span></div>
              )}
              {selectedRecord.damageType && (
                <div><strong className="text-slate-900">Damage Type:</strong> {selectedRecord.damageType}</div>
              )}
              {selectedRecord.nutritionStatus && (
                <div><strong className="text-slate-900">Nutrition Status:</strong> <span className="font-bold">{selectedRecord.nutritionStatus}</span></div>
              )}
              {selectedRecord.healthStatus && (
                <div><strong className="text-slate-900">Health Status:</strong> <span className="font-bold">{selectedRecord.healthStatus}</span></div>
              )}

              {/* Common metadata */}
              {selectedRecord.confidence && (
                <div><strong className="text-slate-900">Confidence Score:</strong> <span className="font-bold text-[#16883D]">{selectedRecord.confidence}%</span></div>
              )}
              {selectedRecord.severity && (
                <div><strong className="text-slate-900">Severity:</strong> <span className="font-bold">{selectedRecord.severity}</span></div>
              )}
              {selectedRecord.affectedPart && (
                <div><strong className="text-slate-900">Affected Part:</strong> {selectedRecord.affectedPart}</div>
              )}
              {selectedRecord.category && (
                <div><strong className="text-slate-900">Plant Category:</strong> {selectedRecord.category}</div>
              )}

              {/* Analysis Summary */}
              {selectedRecord.analysisSummary && (
                <div className="pt-1"><strong className="text-slate-900 block mb-0.5 font-bold">Analysis Summary:</strong> <p className="leading-relaxed">{selectedRecord.analysisSummary}</p></div>
              )}

              {/* Visual Evidence */}
              {selectedRecord.visualEvidence && selectedRecord.visualEvidence.length > 0 && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-slate-900 block mb-1 font-bold flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-[#16883D]" />
                    Visual Evidence:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {selectedRecord.visualEvidence.map((ev, i) => <li key={i}>{ev}</li>)}
                  </ul>
                </div>
              )}

              {/* Symptoms */}
              {selectedRecord.symptoms && selectedRecord.symptoms.length > 0 && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-slate-900 block mb-1 font-bold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-[#16883D]" />
                    Symptoms:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {selectedRecord.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {/* Possible Cause */}
              {selectedRecord.possibleCause && (
                <div className="pt-1">
                  <strong className="text-slate-900 block mb-0.5 font-bold">Possible Cause:</strong>
                  <p className="text-slate-700 leading-relaxed">{selectedRecord.possibleCause}</p>
                </div>
              )}

              {/* Treatment Recommendations */}
              {(selectedRecord.treatmentRecommendations || selectedRecord.recommendedTreatment || selectedRecord.treatment) && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-[#16883D] block mb-1 font-bold flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Treatment Recommendations:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {Array.isArray(selectedRecord.treatmentRecommendations || selectedRecord.recommendedTreatment || selectedRecord.treatment)
                      ? (selectedRecord.treatmentRecommendations || selectedRecord.recommendedTreatment || selectedRecord.treatment).map((t, i) => <li key={i}>{t}</li>)
                      : <li>{selectedRecord.treatmentRecommendations || selectedRecord.recommendedTreatment || selectedRecord.treatment}</li>
                    }
                  </ul>
                </div>
              )}

              {/* Fertilizer & Nutrition Recommendations */}
              {(selectedRecord.fertilizerRecommendations || selectedRecord.fertilizerRecommendation) && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-emerald-700 block mb-1 font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    Fertilizer & Nutrition Suggestions:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {Array.isArray(selectedRecord.fertilizerRecommendations || selectedRecord.fertilizerRecommendation)
                      ? (selectedRecord.fertilizerRecommendations || selectedRecord.fertilizerRecommendation).map((f, i) => <li key={i}>{f}</li>)
                      : <li>{selectedRecord.fertilizerRecommendations || selectedRecord.fertilizerRecommendation}</li>
                    }
                  </ul>
                </div>
              )}

              {/* Plant Care Suggestions */}
              {selectedRecord.plantCareSuggestions && selectedRecord.plantCareSuggestions.length > 0 && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-slate-900 block mb-1 font-bold">Plant Care Suggestions:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {selectedRecord.plantCareSuggestions.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Watering Suggestions */}
              {selectedRecord.wateringSuggestions && selectedRecord.wateringSuggestions.length > 0 && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-sky-700 block mb-1 font-bold">Watering Suggestions:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {selectedRecord.wateringSuggestions.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Soil & Environment Suggestions */}
              {(selectedRecord.soilSuggestions || selectedRecord.environmentSuggestions) && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-amber-800 block mb-1 font-bold">Soil & Environment:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {selectedRecord.soilSuggestions && selectedRecord.soilSuggestions.map((s, i) => <li key={'s-' + i}>{s}</li>)}
                    {selectedRecord.environmentSuggestions && selectedRecord.environmentSuggestions.map((e, i) => <li key={'e-' + i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {/* Organic Control */}
              {selectedRecord.organicControl && selectedRecord.organicControl.length > 0 && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-emerald-800 block mb-1 font-bold">Organic & Biological Control:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {selectedRecord.organicControl.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}

              {/* Prevention */}
              {(selectedRecord.preventionSuggestions || selectedRecord.prevention) && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-slate-900 block mb-1 font-bold">Prevention & Future Care:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {Array.isArray(selectedRecord.preventionSuggestions || selectedRecord.prevention)
                      ? (selectedRecord.preventionSuggestions || selectedRecord.prevention).map((p, i) => <li key={i}>{p}</li>)
                      : <li>{selectedRecord.preventionSuggestions || selectedRecord.prevention}</li>
                    }
                  </ul>
                </div>
              )}

              {/* Monitoring Plan */}
              {selectedRecord.monitoringSuggestions && selectedRecord.monitoringSuggestions.length > 0 && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-slate-900 block mb-1 font-bold">Monitoring Plan ({selectedRecord.followUpTime || '7-14 days'}):</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {selectedRecord.monitoringSuggestions.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}

              {/* Important Notes */}
              {selectedRecord.importantNotes && selectedRecord.importantNotes.length > 0 && (
                <div className="pt-2 border-t border-amber-300">
                  <strong className="text-amber-900 block mb-0.5 font-bold">Important Notes:</strong>
                  <p className="text-amber-800 leading-relaxed font-medium">
                    {Array.isArray(selectedRecord.importantNotes) ? selectedRecord.importantNotes.join(' ') : selectedRecord.importantNotes}
                  </p>
                </div>
              )}

              {/* Additional Advice */}
              {selectedRecord.additionalAdvice && selectedRecord.additionalAdvice.length > 0 && (
                <div className="pt-2 border-t border-emerald-200">
                  <strong className="text-slate-900 block mb-0.5 font-bold">Additional Care Advice:</strong>
                  <p className="text-slate-700 leading-relaxed">
                    {Array.isArray(selectedRecord.additionalAdvice) ? selectedRecord.additionalAdvice.join(' ') : selectedRecord.additionalAdvice}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {(selectedRecord.type === 'disease' || selectedRecord.analysisType === 'Disease Detection') && (
                <button 
                  onClick={() => {
                    const targetId = selectedRecord.analysisId || selectedRecord.id;
                    setSelectedRecord(null);
                    navigate('/tracker', { state: { selectedId: targetId, analysisId: targetId } });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Track Recovery</span>
                </button>
              )}
              <button 
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info Banner */}
      <div className="p-3.5 rounded-xl bg-[#EAF6E8] border border-[#EAF6E8] text-[#16883D] text-xs flex items-center gap-2">
        <Info className="w-4 h-4 shrink-0" />
        <span>Note: All your diagnostic reports, nutrient scans, disease analyses, and plant identification results appear here for easy reference and tracking.</span>
      </div>

    </div>
  );
};
