import React, { useState, useEffect } from 'react';
import { 
  Bug, 
  Plus, 
  Search, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info,
  Layers,
  FileText,
  AlertTriangle,
  Stethoscope,
  BookOpen,
  ShieldAlert,
  Eye,
  Sprout,
  Activity
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

// Helper to normalize affected plants into an array of strings
const extractPlantsArray = (rawVal) => {
  if (!rawVal) return [];
  if (Array.isArray(rawVal)) {
    return rawVal.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof rawVal === 'string') {
    return rawVal.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
};

export const AdminPests = () => {
  const [pests, setPests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firestore Plants collection state (read-only for multi-select)
  const [availablePlants, setAvailablePlants] = useState([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [plantsError, setPlantsError] = useState(null);

  // Affected Plants Selector UI state
  const [plantSearchTerm, setPlantSearchTerm] = useState('');
  const [isPlantDropdownOpen, setIsPlantDropdownOpen] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Active form/selected item states
  const [selectedPest, setSelectedPest] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Form Fields State matching exact pest sections
  const [formValues, setFormValues] = useState({
    pestName: '',
    scientificName: '',
    category: 'Insects',
    description: '',
    affectedPlants: [],
    severity: 'Moderate',
    symptoms: '',
    damageSigns: '',
    prevention: '',
    treatment: '',
    imageUrl: ''
  });

  // Real-time listener for 'pests' collection
  useEffect(() => {
    setLoading(true);
    setError(null);

    const pestsRef = collection(db, 'pests');
    const unsubscribe = onSnapshot(pestsRef, (snapshot) => {
      const loadedPests = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const pestName = data.pestName || data.name || data.title || 'Unnamed Pest';
        const scientificName = data.scientificName || data.latinName || 'N/A';
        const category = data.category || data.pestType || data.type || 'Insects';
        
        const rawPlants = data.affectedPlants ?? data.hostPlants ?? data.plants ?? '';
        const affectedPlantsArray = extractPlantsArray(rawPlants);
        const affectedPlants = affectedPlantsArray.join(', ');
        const severity = data.severity || 'Moderate';
        const description = data.description || data.overview || '';
        const imageUrl = data.imageUrl || data.image || data.imageURL || '';
        
        const symptoms = Array.isArray(data.symptoms) 
          ? data.symptoms.join('\n') 
          : (data.symptoms || '');
        const damageSigns = Array.isArray(data.damageSigns) 
          ? data.damageSigns.join('\n') 
          : (data.damageSigns || data.visualEvidence || '');
        const prevention = Array.isArray(data.prevention) 
          ? data.prevention.join('\n') 
          : (data.prevention || '');
        const treatment = Array.isArray(data.treatment) 
          ? data.treatment.join('\n') 
          : (data.treatment || data.treatmentOptions || data.recommendedTreatment || '');

        return {
          id: docSnap.id,
          pestName,
          scientificName,
          category,
          affectedPlants,
          affectedPlantsArray,
          severity,
          description,
          imageUrl,
          symptoms,
          damageSigns,
          prevention,
          treatment,
          raw: data
        };
      });

      setPests(loadedPests);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching pests from Firestore:", err);
      setError("Failed to load pest records from Firebase Firestore.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for 'plants' collection (read-only)
  useEffect(() => {
    setPlantsLoading(true);
    setPlantsError(null);

    const plantsRef = collection(db, 'plants');
    const unsubscribePlants = onSnapshot(plantsRef, (snapshot) => {
      const loadedPlants = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const commonName = data.commonName || data.plantName || data.name || 'Unnamed Plant';
        const scientificName = data.scientificName || data.species || data.botanicalName || '';
        return {
          id: docSnap.id,
          commonName,
          scientificName,
          raw: data
        };
      });

      setAvailablePlants(loadedPlants);
      setPlantsLoading(false);
    }, (err) => {
      console.error("Error fetching plants from Firestore:", err);
      setPlantsError("Failed to load plants from database.");
      setPlantsLoading(false);
    });

    return () => unsubscribePlants();
  }, []);

  // Compute dynamic category list from existing Firestore pest records
  const existingCategories = Array.from(
    new Set(pests.map(p => p.category).filter(Boolean))
  );
  const allCategories = Array.from(
    new Set(['All Categories', 'Insects', 'Mites', 'Worms', 'Other', ...existingCategories])
  );

  // Filtered Pests computation across multiple search fields locally
  const filteredPests = pests.filter((pest) => {
    if (selectedCategory !== 'All Categories' && pest.category !== selectedCategory) {
      return false;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      (pest.pestName && pest.pestName.toLowerCase().includes(searchLower)) ||
      (pest.scientificName && pest.scientificName.toLowerCase().includes(searchLower)) ||
      (pest.category && pest.category.toLowerCase().includes(searchLower)) ||
      (pest.affectedPlants && pest.affectedPlants.toLowerCase().includes(searchLower)) ||
      (pest.description && pest.description.toLowerCase().includes(searchLower)) ||
      (pest.symptoms && pest.symptoms.toLowerCase().includes(searchLower)) ||
      (pest.damageSigns && pest.damageSigns.toLowerCase().includes(searchLower)) ||
      (pest.prevention && pest.prevention.toLowerCase().includes(searchLower)) ||
      (pest.treatment && pest.treatment.toLowerCase().includes(searchLower))
    );
  });

  // Reset Form
  const resetFormState = () => {
    setFormValues({
      pestName: '',
      scientificName: '',
      category: 'Insects',
      description: '',
      affectedPlants: [],
      severity: 'Moderate',
      symptoms: '',
      damageSigns: '',
      prevention: '',
      treatment: '',
      imageUrl: ''
    });
    setPlantSearchTerm('');
    setIsPlantDropdownOpen(false);
    setFormError(null);
    setFormSuccess(null);
    setSelectedPest(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    resetFormState();
    setShowAddModal(true);
  };

  // Open View Modal
  const handleOpenView = (pest) => {
    setSelectedPest(pest);
    setShowViewModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pest) => {
    resetFormState();
    setSelectedPest(pest);

    const rawData = pest.raw || {};
    const rawPlants = rawData.affectedPlants ?? rawData.hostPlants ?? rawData.plants ?? pest.affectedPlantsArray ?? pest.affectedPlants;
    const initialAffectedPlants = extractPlantsArray(rawPlants);

    const symptomsStr = Array.isArray(pest.symptoms) ? pest.symptoms.join('\n') : (pest.symptoms || '');
    const damageSignsStr = Array.isArray(pest.damageSigns) ? pest.damageSigns.join('\n') : (pest.damageSigns || '');
    const preventionStr = Array.isArray(pest.prevention) ? pest.prevention.join('\n') : (pest.prevention || '');
    const treatmentStr = Array.isArray(pest.treatment) ? pest.treatment.join('\n') : (pest.treatment || '');

    setFormValues({
      pestName: pest.pestName || '',
      scientificName: pest.scientificName !== 'N/A' ? pest.scientificName : '',
      category: pest.category || 'Insects',
      description: pest.description || '',
      affectedPlants: initialAffectedPlants,
      severity: pest.severity || 'Moderate',
      symptoms: symptomsStr,
      damageSigns: damageSignsStr,
      prevention: preventionStr,
      treatment: treatmentStr,
      imageUrl: pest.imageUrl || ''
    });
    setShowEditModal(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (pest) => {
    setSelectedPest(pest);
    setShowDeleteModal(true);
  };

  // Build payload for save/update operations preserving standard and legacy fields
  const buildPayload = () => {
    const pName = formValues.pestName.trim();
    const cat = formValues.category.trim();

    const affectedPlantsArray = Array.isArray(formValues.affectedPlants)
      ? formValues.affectedPlants.map(s => String(s).trim()).filter(Boolean)
      : [];

    const symptomsArray = formValues.symptoms.trim() 
      ? formValues.symptoms.trim().split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const damageSignsArray = formValues.damageSigns.trim() 
      ? formValues.damageSigns.trim().split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const preventionArray = formValues.prevention.trim() 
      ? formValues.prevention.trim().split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const treatmentArray = formValues.treatment.trim() 
      ? formValues.treatment.trim().split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      pestName: pName,
      name: pName,
      title: pName,
      scientificName: formValues.scientificName.trim(),
      category: cat,
      pestType: cat,
      description: formValues.description.trim(),
      overview: formValues.description.trim(),
      affectedPlants: affectedPlantsArray,
      severity: formValues.severity,
      symptoms: symptomsArray,
      damageSigns: damageSignsArray,
      visualEvidence: damageSignsArray,
      prevention: preventionArray,
      treatment: treatmentArray,
      recommendedTreatment: treatmentArray,
      treatmentOptions: treatmentArray,
      imageUrl: formValues.imageUrl.trim(),
      image: formValues.imageUrl.trim()
    };

    if (selectedPest?.raw?.hostPlants !== undefined) {
      payload.hostPlants = affectedPlantsArray;
    }
    if (selectedPest?.raw?.plants !== undefined) {
      payload.plants = affectedPlantsArray;
    }

    return payload;
  };

  // Handle Add Pest Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const pName = formValues.pestName.trim();
    const cat = formValues.category.trim();

    if (!pName) {
      setFormError("Pest Name is required.");
      return;
    }
    if (!cat) {
      setFormError("Category is required.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...buildPayload(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'pests'), payload);

      setFormSuccess("New pest record added successfully to Firestore!");
      setTimeout(() => {
        setShowAddModal(false);
        resetFormState();
      }, 1200);
    } catch (err) {
      console.error("Error adding pest to Firestore:", err);
      setFormError(err.message || "Failed to save new pest record to Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit Pest Submit (merges with existing doc to preserve unknown fields)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPest) return;

    setFormError(null);
    setFormSuccess(null);

    const pName = formValues.pestName.trim();
    const cat = formValues.category.trim();

    if (!pName) {
      setFormError("Pest Name is required.");
      return;
    }
    if (!cat) {
      setFormError("Category is required.");
      return;
    }

    setIsSaving(true);

    try {
      const pestDocRef = doc(db, 'pests', selectedPest.id);
      const payload = buildPayload();

      await setDoc(pestDocRef, payload, { merge: true });

      setFormSuccess("Pest record updated successfully in Firestore!");
      setTimeout(() => {
        setShowEditModal(false);
        resetFormState();
      }, 1200);
    } catch (err) {
      console.error("Error updating pest in Firestore:", err);
      setFormError(err.message || "Failed to update pest in Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedPest) return;

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'pests', selectedPest.id));
      setShowDeleteModal(false);
      setSelectedPest(null);
    } catch (err) {
      console.error("Error deleting pest from Firestore:", err);
      alert(err.message || "Failed to delete pest from Firestore.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper renderer for Form Sections
  const renderFormFields = () => (
    <div className="space-y-6">
      
      {/* 1. Pest Information */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          <span>1. Pest Information</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Pest Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formValues.pestName}
              onChange={(e) => setFormValues(prev => ({ ...prev, pestName: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="e.g. Aphids / Spider Mites"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Scientific Name
            </label>
            <input
              type="text"
              value={formValues.scientificName}
              onChange={(e) => setFormValues(prev => ({ ...prev, scientificName: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="e.g. Aphididae / Tetranychidae"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={formValues.category}
              onChange={(e) => setFormValues(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
            >
              <option value="Insects">Insects</option>
              <option value="Mites">Mites</option>
              <option value="Worms">Worms</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Description & Overview
            </label>
            <textarea
              rows={2}
              value={formValues.description}
              onChange={(e) => setFormValues(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="Overview of the pest behavior and characteristics..."
            />
          </div>
        </div>
      </div>

      {/* 2. Affected Plants */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>2. Affected Plants</span>
        </h4>

        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Select Affected Plants
          </label>

          {/* Selected Plants Chips */}
          <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] items-center">
            {Array.isArray(formValues.affectedPlants) && formValues.affectedPlants.length > 0 ? (
              formValues.affectedPlants.map((plantName, idx) => {
                const isExistingPlant = availablePlants.some(
                  p => (p.commonName || '').toLowerCase() === String(plantName).toLowerCase()
                );

                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                      isExistingPlant
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-[#16883D] dark:text-[#22C55E] border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <span>{plantName}</span>
                    {!isExistingPlant && (
                      <span className="text-[10px] opacity-75 font-normal">(existing record)</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFormValues(prev => ({
                          ...prev,
                          affectedPlants: prev.affectedPlants.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="hover:opacity-75 focus:outline-none p-0.5 rounded-full"
                      title={`Remove ${plantName}`}
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic px-1">
                No plants selected. Use the search dropdown below to select plants.
              </span>
            )}
          </div>

          {/* Searchable Plant Dropdown */}
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={plantSearchTerm}
                onFocus={() => setIsPlantDropdownOpen(true)}
                onChange={(e) => {
                  setPlantSearchTerm(e.target.value);
                  setIsPlantDropdownOpen(true);
                }}
                placeholder={plantsLoading ? "Loading plants..." : "Search plants to add (by common or scientific name)..."}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              />
              <button
                type="button"
                onClick={() => setIsPlantDropdownOpen(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isPlantDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown options */}
            {isPlantDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsPlantDropdownOpen(false)} 
                />
                
                <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#1A1D23] shadow-xl py-1">
                  {plantsLoading ? (
                    <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#16883D]" />
                      <span>Loading plants...</span>
                    </div>
                  ) : plantsError ? (
                    <div className="p-3 text-center text-xs text-rose-500 font-medium">
                      {plantsError}
                    </div>
                  ) : availablePlants.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                      No plants available. Add plants from Manage Plants.
                    </div>
                  ) : (
                    (() => {
                      const filtered = availablePlants.filter(p => {
                        const s = plantSearchTerm.toLowerCase().trim();
                        if (!s) return true;
                        return (
                          (p.commonName && p.commonName.toLowerCase().includes(s)) ||
                          (p.scientificName && p.scientificName.toLowerCase().includes(s))
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                            No plants matching "{plantSearchTerm}"
                          </div>
                        );
                      }

                      return filtered.map(plant => {
                        const isSelected = Array.isArray(formValues.affectedPlants) && formValues.affectedPlants.some(
                          name => String(name).toLowerCase() === plant.commonName.toLowerCase()
                        );

                        return (
                          <button
                            key={plant.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormValues(prev => ({
                                  ...prev,
                                  affectedPlants: prev.affectedPlants.filter(
                                    name => String(name).toLowerCase() !== plant.commonName.toLowerCase()
                                  )
                                }));
                              } else {
                                setFormValues(prev => ({
                                  ...prev,
                                  affectedPlants: [...prev.affectedPlants, plant.commonName]
                                }));
                              }
                            }}
                            className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                              isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/40' : ''
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className={`font-bold ${isSelected ? 'text-[#16883D] dark:text-[#22C55E]' : 'text-slate-800 dark:text-slate-200'}`}>
                                {plant.commonName}
                              </span>
                              {plant.scientificName && (
                                <span className="text-[10px] text-slate-400 italic">
                                  {plant.scientificName}
                                </span>
                              )}
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-[#16883D] dark:text-[#22C55E] shrink-0" />
                            )}
                          </button>
                        );
                      });
                    })()
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Damage & Severity */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>3. Damage & Severity</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Severity Level
            </label>
            <select
              value={formValues.severity}
              onChange={(e) => setFormValues(prev => ({ ...prev, severity: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
            >
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Symptoms (One item per line)
            </label>
            <textarea
              rows={2}
              value={formValues.symptoms}
              onChange={(e) => setFormValues(prev => ({ ...prev, symptoms: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="Leaf curling&#10;Yellowing foliage"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Damage Signs (One item per line)
            </label>
            <textarea
              rows={2}
              value={formValues.damageSigns}
              onChange={(e) => setFormValues(prev => ({ ...prev, damageSigns: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="Chewed leaf margins&#10;Sticky sap residue"
            />
          </div>
        </div>
      </div>

      {/* 4. Management */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>4. Management & Treatment</span>
        </h4>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Prevention (One item per line)
            </label>
            <textarea
              rows={2}
              value={formValues.prevention}
              onChange={(e) => setFormValues(prev => ({ ...prev, prevention: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="Inspect leaves weekly&#10;Avoid excess nitrogen fertilizer"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Treatment / Control (One item per line)
            </label>
            <textarea
              rows={2}
              value={formValues.treatment}
              onChange={(e) => setFormValues(prev => ({ ...prev, treatment: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="Apply organic neem oil spray&#10;Wash with insecticidal soap"
            />
          </div>
        </div>
      </div>

      {/* 5. Image */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <Bug className="w-3.5 h-3.5" />
          <span>5. Image</span>
        </h4>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Image URL / Asset Path
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={formValues.imageUrl}
              onChange={(e) => setFormValues(prev => ({ ...prev, imageUrl: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="https://images.unsplash.com/... or /src/assets/..."
            />
            {formValues.imageUrl && (
              <img 
                src={formValues.imageUrl} 
                alt="Preview" 
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 select-none transition-colors duration-300">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#16883D] dark:text-[#22C55E] tracking-tight flex items-center gap-2">
            <Bug className="w-6 h-6 stroke-[2.5]" />
            <span>Manage Pests</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Add, edit or delete pest information and treatment guidelines in Firestore.
          </p>
        </div>

        {/* Add New Pest Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#16883D] text-[#16883D] dark:text-[#22C55E] dark:border-[#22C55E] hover:bg-[#16883D] hover:text-white dark:hover:bg-[#16883D] dark:hover:text-white font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Pest</span>
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
          <div className="sm:col-span-7 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Search Pest
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by pest name, scientific name, plants, symptoms, damage, treatment..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Pest Category Filter
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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
                <th className="py-3 px-4">Pest Image</th>
                <th className="py-3 px-4">Pest Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Affected Plants</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 text-[#16883D] dark:text-[#22C55E] animate-spin" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Loading pest records from Firebase...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredPests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      
                      {/* Empty State Graphic */}
                      <div className="w-16 h-16 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shadow-sm">
                        <Bug className="w-8 h-8 stroke-[2]" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          No pests found
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {searchTerm || selectedCategory !== 'All Categories'
                            ? "No pest records match your search and category criteria."
                            : "There are no pest records stored in the database yet."}
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                filteredPests.map((pest, idx) => (
                  <tr key={pest.id || idx} className="border-t border-slate-100 dark:border-[#2A2E36] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium">{idx + 1}</td>
                    
                    {/* Pest Thumbnail */}
                    <td className="py-3.5 px-4">
                      {pest.imageUrl ? (
                        <img 
                          src={pest.imageUrl} 
                          alt={pest.pestName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                          onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                          <Bug className="w-5 h-5 stroke-[2]" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{pest.pestName}</div>
                      {pest.scientificName && pest.scientificName !== 'N/A' && (
                        <div className="text-[10px] text-slate-400 italic">{pest.scientificName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        {pest.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {pest.affectedPlants || 'All Plants'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        pest.severity === 'High' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                        pest.severity === 'Low' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {pest.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {pest.description || 'No description provided.'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenView(pest)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1"
                          title="View Pest Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(pest)}
                          className="px-2.5 py-1 rounded-lg bg-[#EAF6E8] dark:bg-[#132B1F] hover:bg-[#d8edd4] dark:hover:bg-[#1b3d2b] text-[#16883D] dark:text-[#22C55E] text-xs font-bold transition-all flex items-center gap-1"
                          title="Edit Pest"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(pest)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1"
                          title="Delete Pest"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
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
        <span>All pest data added here will be available to users in the pest detection and plant care modules.</span>
      </div>

      {/* ADD PEST MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
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
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-2">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Add New Pest Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Add pest specifications and treatment guidelines to the Firestore database.
              </p>
            </div>

            {/* Error & Success Alerts */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#16883D] dark:text-[#22C55E] text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16883D] dark:text-[#22C55E]" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-6">
              {renderFormFields()}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                    <span>Save Pest</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EDIT PEST MODAL */}
      {showEditModal && selectedPest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-2">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Edit Pest Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Update pest knowledge base details and damage characteristics.
              </p>
            </div>

            {/* Error & Success Alerts */}
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#16883D] dark:text-[#22C55E] text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16883D] dark:text-[#22C55E]" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {renderFormFields()}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                      <span>Saving Changes...</span>
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

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && selectedPest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5">
            
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Delete Pest Record?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{selectedPest.pestName}"</span> from the pest knowledge base?
              </p>
              <p className="text-[11px] text-slate-400">
                This will permanently delete this record from the pest knowledge base. User analysis history and plants will not be affected.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] hover:bg-slate-50 dark:hover:bg-[#222630] text-slate-700 dark:text-slate-300 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW PEST DETAILS MODAL (READ-ONLY) */}
      {showViewModal && selectedPest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setShowViewModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Title section */}
            <div className="flex items-start gap-4 pr-8">
              {selectedPest.imageUrl ? (
                <img 
                  src={selectedPest.imageUrl} 
                  alt={selectedPest.pestName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                  onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
                  <Bug className="w-8 h-8 stroke-[2]" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    {selectedPest.category || 'Insects'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    selectedPest.severity === 'High' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                    selectedPest.severity === 'Low' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                    'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}>
                    Severity: {selectedPest.severity || 'Moderate'}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedPest.pestName}
                </h3>
                {selectedPest.scientificName && selectedPest.scientificName !== 'N/A' && (
                  <p className="text-xs text-slate-400 italic">
                    {selectedPest.scientificName}
                  </p>
                )}
              </div>
            </div>

            {/* Pest details body */}
            <div className="space-y-5 border-t border-slate-100 dark:border-[#2A2E36] pt-5">
              
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Overview & Description
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedPest.description || 'No description available for this pest record.'}
                </p>
              </div>

              {/* Affected Plants */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                  Affected Plants
                </h4>
                {selectedPest.affectedPlantsArray && selectedPest.affectedPlantsArray.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPest.affectedPlantsArray.map((plant, pIdx) => (
                      <span key={pIdx} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
                        {plant}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedPest.affectedPlants || 'All vulnerable plant species.'}
                  </p>
                )}
              </div>

              {/* Symptoms */}
              {selectedPest.symptoms && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Symptoms
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedPest.symptoms}
                  </p>
                </div>
              )}

              {/* Damage Signs */}
              {selectedPest.damageSigns && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-purple-500" />
                    Damage Signs & Visual Evidence
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedPest.damageSigns}
                  </p>
                </div>
              )}

              {/* Prevention */}
              {selectedPest.prevention && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    Prevention & Proactive Care
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedPest.prevention}
                  </p>
                </div>
              )}

              {/* Treatment */}
              {selectedPest.treatment && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-500" />
                    Recommended Treatment / Control
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedPest.treatment}
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#2A2E36] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenEdit(selectedPest);
                }}
                className="px-4 py-2 rounded-xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] text-xs font-bold hover:bg-[#d8edd4] dark:hover:bg-[#1b3d2b] transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Record</span>
              </button>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPests;

