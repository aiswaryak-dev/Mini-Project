import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Plus, 
  Search, 
  Info, 
  ChevronDown, 
  Loader2, 
  X, 
  Activity, 
  Sprout, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  Save 
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const CANONICAL_PLANTS = [
  'Rose', 'Hibiscus', 'Jasmine', 'Marigold', 'Sunflower',
  'Tomato', 'Chilli', 'Brinjal', 'Spinach', 'Mint', 'Coriander'
];

export const AdminTreatments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [relatedToFilter, setRelatedToFilter] = useState('All (Disease / Pest / Deficiency)');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [treatmentTypeFilter, setTreatmentTypeFilter] = useState('All Types');
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availablePlants, setAvailablePlants] = useState(CANONICAL_PLANTS);

  // Modal Visibility States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Active Selected Item & Action States
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState(null);

  const initialFormState = {
    treatmentName: '',
    relatedTo: 'Disease',
    targetCondition: '',
    category: 'Kitchen Garden',
    treatmentType: 'Organic',
    treatmentDescription: '',
    application: '',
    prevention: '',
    precautions: '',
    affectedPlants: []
  };

  const [formValues, setFormValues] = useState(initialFormState);

  // Real-time listener for 'treatments' collection
  useEffect(() => {
    setLoading(true);
    const treatmentsRef = collection(db, 'treatments');
    const unsubscribe = onSnapshot(treatmentsRef, (snapshot) => {
      const loaded = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          treatmentName: data.treatmentName || data.title || 'N/A',
          relatedTo: data.relatedTo || 'Disease',
          targetCondition: data.targetCondition || data.condition || data.targetDisease || data.targetPest || data.targetNutrient || 'General',
          category: data.category || 'Kitchen Garden',
          type: data.treatmentType || data.type || 'Organic',
          description: data.treatmentDescription || data.description || '',
          application: data.application || '',
          prevention: data.prevention || '',
          precautions: data.precautions || '',
          affectedPlants: data.affectedPlants || [],
          raw: data
        };
      });
      setTreatments(loaded);
      setLoading(false);
    }, (err) => {
      console.error("Error loading treatments from Firestore:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch plant list to populate selector if available
  useEffect(() => {
    const plantsRef = collection(db, 'plants');
    const unsubscribePlants = onSnapshot(plantsRef, (snap) => {
      if (!snap.empty) {
        const loaded = snap.docs.map(d => d.data().commonName || d.data().name).filter(Boolean);
        if (loaded.length > 0) {
          const combined = Array.from(new Set([...CANONICAL_PLANTS, ...loaded]));
          setAvailablePlants(combined);
        }
      }
    }, () => {});
    return () => unsubscribePlants();
  }, []);

  // Filtered Treatments
  const filteredTreatments = treatments.filter((item) => {
    if (relatedToFilter !== 'All (Disease / Pest / Deficiency)') {
      if (relatedToFilter === 'Disease' && item.relatedTo !== 'Disease') return false;
      if (relatedToFilter === 'Pest' && item.relatedTo !== 'Pest') return false;
      if (relatedToFilter === 'Nutrient Deficiency' && item.relatedTo !== 'Nutrient Deficiency') return false;
    }

    if (categoryFilter !== 'All Categories' && item.category !== categoryFilter) return false;
    if (treatmentTypeFilter !== 'All Types' && item.type !== treatmentTypeFilter) return false;

    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    return (
      item.treatmentName.toLowerCase().includes(term) ||
      item.targetCondition.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      (Array.isArray(item.affectedPlants) && item.affectedPlants.some(p => p.toLowerCase().includes(term)))
    );
  });

  // Handlers
  const handleOpenAdd = () => {
    setFormValues(initialFormState);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedTreatment(item);
    const raw = item.raw || {};
    setFormValues({
      treatmentName: item.treatmentName || '',
      relatedTo: item.relatedTo || 'Disease',
      targetCondition: item.targetCondition || '',
      category: item.category || 'Kitchen Garden',
      treatmentType: item.type || 'Organic',
      treatmentDescription: item.description || '',
      application: raw.application || '',
      prevention: raw.prevention || '',
      precautions: raw.precautions || '',
      affectedPlants: Array.isArray(item.affectedPlants) ? item.affectedPlants : []
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedTreatment(item);
    setShowDeleteModal(true);
  };

  const togglePlantSelection = (plantName) => {
    setFormValues(prev => {
      const current = prev.affectedPlants || [];
      if (current.includes(plantName)) {
        return { ...prev, affectedPlants: current.filter(p => p !== plantName) };
      } else {
        return { ...prev, affectedPlants: [...current, plantName] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = formValues.treatmentName.trim();
    const cleanTarget = formValues.targetCondition.trim();

    if (!cleanTitle || !cleanTarget) {
      setFormError("Treatment Name and Condition / Problem are required.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        treatmentName: cleanTitle,
        title: cleanTitle,
        relatedTo: formValues.relatedTo,
        targetCondition: cleanTarget,
        condition: cleanTarget,
        targetDisease: formValues.relatedTo === 'Disease' ? cleanTarget : '',
        targetPest: formValues.relatedTo === 'Pest' ? cleanTarget : '',
        targetNutrient: formValues.relatedTo === 'Nutrient Deficiency' ? cleanTarget : '',
        category: formValues.category,
        treatmentType: formValues.treatmentType,
        type: formValues.treatmentType,
        treatmentDescription: formValues.treatmentDescription.trim(),
        description: formValues.treatmentDescription.trim(),
        application: formValues.application.trim(),
        prevention: formValues.prevention.trim(),
        precautions: formValues.precautions.trim(),
        affectedPlants: formValues.affectedPlants,
        updatedAt: serverTimestamp()
      };

      if (showEditModal && selectedTreatment?.id) {
        await setDoc(doc(db, 'treatments', selectedTreatment.id), payload, { merge: true });
        setShowEditModal(false);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'treatments'), payload);
        setShowAddModal(false);
      }

      setFormValues(initialFormState);
      setSelectedTreatment(null);
    } catch (err) {
      console.error("Error saving treatment record:", err);
      setFormError("Failed to save treatment record to database. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTreatment?.id) return;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'treatments', selectedTreatment.id));
      setShowDeleteModal(false);
      setSelectedTreatment(null);
    } catch (err) {
      console.error("Error deleting treatment document:", err);
      alert("Failed to delete treatment record.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 select-none transition-colors duration-300">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#16883D] dark:text-[#22C55E] tracking-tight flex items-center gap-2">
            <Pill className="w-6 h-6 stroke-[2.5]" />
            <span>Manage Treatment Recommendations</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Add, edit or delete treatment recommendations in the system.
          </p>
        </div>

        {/* Add New Recommendation Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#16883D] text-[#16883D] dark:text-[#22C55E] dark:border-[#22C55E] hover:bg-[#16883D] hover:text-white dark:hover:bg-[#16883D] dark:hover:text-white font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Recommendation</span>
        </button>
      </div>

      {/* Search & Filter Card */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-5 border border-slate-100 dark:border-[#2A2E36] shadow-sm transition-colors duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          
          {/* Search Input */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Search Recommendation
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by treatment or keyword..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              />
            </div>
          </div>

          {/* Related To Dropdown */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Related To
            </label>
            <div className="relative">
              <select
                value={relatedToFilter}
                onChange={(e) => setRelatedToFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All (Disease / Pest / Deficiency)">All (Disease / Pest / Deficiency)</option>
                <option value="Disease">Disease</option>
                <option value="Pest">Pest</option>
                <option value="Nutrient Deficiency">Nutrient Deficiency</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Affecting Plant Category Dropdown */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Affecting Plant Category
            </label>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All Categories">All Categories</option>
                <option value="Garden Plants">Garden Plants</option>
                <option value="Kitchen Garden">Kitchen Garden</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Treatment Type Dropdown */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Treatment Type
            </label>
            <div className="relative">
              <select
                value={treatmentTypeFilter}
                onChange={(e) => setTreatmentTypeFilter(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All Types">All Types</option>
                <option value="Organic">Organic</option>
                <option value="Chemical">Chemical</option>
                <option value="Preventative">Preventative</option>
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
                <th className="py-3 px-4">Title / Treatment Name</th>
                <th className="py-3 px-4">Related To</th>
                <th className="py-3 px-4">Condition / Problem</th>
                <th className="py-3 px-4">Affecting Plant Category</th>
                <th className="py-3 px-4">Treatment Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-[#16883D] dark:text-[#22C55E]">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <span className="text-xs font-semibold">Loading treatment recommendations...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTreatments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      
                      {/* Empty State Vector Graphic */}
                      <div className="w-16 h-16 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shadow-sm">
                        <Pill className="w-8 h-8 stroke-[2]" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          No treatment recommendations found
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          There are no treatment recommendations matching your criteria.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Click on <span className="font-semibold text-[#16883D] dark:text-[#22C55E]">"Add New Recommendation"</span> to get started.
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                filteredTreatments.map((item, idx) => (
                  <tr key={item.id || idx} className="border-t border-slate-100 dark:border-[#2A2E36] hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-mono font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{item.treatmentName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.relatedTo === 'Disease'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          : item.relatedTo === 'Pest'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {item.relatedTo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">{item.targetCondition}</td>
                    <td className="py-3.5 px-4">{item.category}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-[11px]">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{item.description}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedTreatment(item);
                            setShowViewModal(true);
                          }}
                          className="text-xs text-[#16883D] dark:text-[#22C55E] font-bold hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
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
        <span>Treatment recommendations will be shown to users based on the disease, pest or nutrient deficiency detected by the system.</span>
      </div>

      {/* View Treatment Details Modal */}
      {showViewModal && selectedTreatment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-[#2A2E36] my-8 space-y-6 text-xs text-slate-700 dark:text-slate-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                  <Pill className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedTreatment.treatmentName}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Related to {selectedTreatment.relatedTo}: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedTreatment.targetCondition}</span> ({selectedTreatment.category})
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setShowViewModal(false); setSelectedTreatment(null); }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#222630] border border-slate-200 dark:border-[#3F4452]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Related To</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTreatment.relatedTo}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Condition</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTreatment.targetCondition}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Treatment Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTreatment.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plant Category</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedTreatment.category}</span>
              </div>
            </div>

            {/* Description */}
            {selectedTreatment.description && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Description</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedTreatment.description}</p>
              </div>
            )}

            {/* Application & Method */}
            {selectedTreatment.raw?.application && (
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Application & Method</span>
                </h4>
                <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed">{selectedTreatment.raw.application}</p>
              </div>
            )}

            {/* Prevention & Precautions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTreatment.raw?.prevention && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Prevention Protocol</span>
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">{selectedTreatment.raw.prevention}</p>
                </div>
              )}

              {selectedTreatment.raw?.precautions && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Precautions & Safety</span>
                  </h4>
                  <p className="text-amber-800 dark:text-amber-200 leading-relaxed">{selectedTreatment.raw.precautions}</p>
                </div>
              )}
            </div>

            {/* Affected Plants */}
            {selectedTreatment.affectedPlants && selectedTreatment.affectedPlants.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-[#16883D] dark:text-[#22C55E]" />
                  <span>Applicable Plants ({selectedTreatment.affectedPlants.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTreatment.affectedPlants.map((plant, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] text-[11px] font-bold">
                      {plant}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 flex justify-end border-t border-slate-100 dark:border-[#2A2E36]">
              <button
                onClick={() => { setShowViewModal(false); setSelectedTreatment(null); }}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-[#16883D] text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Treatment Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-[#2A2E36] my-8 space-y-5 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {showEditModal ? 'Edit Treatment Recommendation' : 'Add New Recommendation'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {showEditModal ? 'Update treatment details in the system database.' : 'Enter treatment recommendation details.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedTreatment(null); }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Treatment Title / Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.treatmentName}
                    onChange={(e) => setFormValues({ ...formValues, treatmentName: e.target.value })}
                    placeholder="e.g. Copper & Neem Spray"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Target Condition / Problem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.targetCondition}
                    onChange={(e) => setFormValues({ ...formValues, targetCondition: e.target.value })}
                    placeholder="e.g. Anthracnose or Aphids"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Related To
                  </label>
                  <select
                    value={formValues.relatedTo}
                    onChange={(e) => setFormValues({ ...formValues, relatedTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  >
                    <option value="Disease">Disease</option>
                    <option value="Pest">Pest</option>
                    <option value="Nutrient Deficiency">Nutrient Deficiency</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Plant Category
                  </label>
                  <select
                    value={formValues.category}
                    onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  >
                    <option value="Kitchen Garden">Kitchen Garden</option>
                    <option value="Garden Plants">Garden Plants</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Treatment Type
                  </label>
                  <select
                    value={formValues.treatmentType}
                    onChange={(e) => setFormValues({ ...formValues, treatmentType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  >
                    <option value="Organic">Organic</option>
                    <option value="Chemical">Chemical</option>
                    <option value="Preventative">Preventative</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Treatment Description
                </label>
                <textarea
                  rows={2}
                  value={formValues.treatmentDescription}
                  onChange={(e) => setFormValues({ ...formValues, treatmentDescription: e.target.value })}
                  placeholder="Overview of the treatment approach..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Application & Method
                </label>
                <textarea
                  rows={2}
                  value={formValues.application}
                  onChange={(e) => setFormValues({ ...formValues, application: e.target.value })}
                  placeholder="How to apply (dosage, frequency, method)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Prevention Protocol
                  </label>
                  <textarea
                    rows={2}
                    value={formValues.prevention}
                    onChange={(e) => setFormValues({ ...formValues, prevention: e.target.value })}
                    placeholder="Cultural practices to prevent recurrence..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Precautions & Safety
                  </label>
                  <textarea
                    rows={2}
                    value={formValues.precautions}
                    onChange={(e) => setFormValues({ ...formValues, precautions: e.target.value })}
                    placeholder="Safety measures or sun restrictions..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Applicable Plants
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#222630] border border-slate-200 dark:border-[#3F4452] max-h-32 overflow-y-auto">
                  {availablePlants.map((plant) => {
                    const isSelected = formValues.affectedPlants.includes(plant);
                    return (
                      <button
                        type="button"
                        key={plant}
                        onClick={() => togglePlantSelection(plant)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          isSelected
                            ? 'bg-[#16883D] text-white shadow-sm'
                            : 'bg-white dark:bg-[#1A1D23] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#16883D]'
                        }`}
                      >
                        {plant} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#2A2E36]">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedTreatment(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#16883D] text-white font-bold text-xs hover:bg-[#126b30] shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{showEditModal ? 'Update Treatment' : 'Save Treatment'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTreatment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1A1D23] rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-[#2A2E36] space-y-5 text-xs text-center">
            
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Delete Treatment Recommendation?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">"{selectedTreatment.treatmentName}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setSelectedTreatment(null); }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
