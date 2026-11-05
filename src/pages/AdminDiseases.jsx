import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  Eye,
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
  Activity,
  Sprout,
  Bug
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

export const AdminDiseases = () => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firestore Plants collection state
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
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Form Fields State matching exact sections
  const [formValues, setFormValues] = useState({
    diseaseName: '',
    scientificName: '',
    category: 'Fungal',
    description: '',
    pathogen: '',
    causalAgent: '',
    affectedPlants: [],
    severity: 'Moderate',
    symptoms: '',
    causes: '',
    prevention: '',
    treatment: '',
    imageUrl: ''
  });

  // Real-time listener for 'diseases' collection
  useEffect(() => {
    setLoading(true);
    setError(null);

    const diseasesRef = collection(db, 'diseases');
    const unsubscribe = onSnapshot(diseasesRef, (snapshot) => {
      const loadedDiseases = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const diseaseName = data.diseaseName || data.name || data.title || 'Unnamed Disease';
        const scientificName = data.scientificName || data.latinName || 'N/A';
        const category = data.category || data.diseaseType || data.type || 'Fungal';
        const pathogen = data.pathogen || data.causalAgent || '';
        const causalAgent = data.causalAgent || data.pathogen || '';
        
        const rawPlants = data.affectedPlants ?? data.hostPlants ?? data.plants ?? '';
        const affectedPlantsArray = extractPlantsArray(rawPlants);
        const affectedPlants = affectedPlantsArray.join(', ');
        const severity = data.severity || 'Moderate';
        const description = data.description || data.overview || '';
        const imageUrl = data.imageUrl || data.image || data.imageURL || '';
        
        const symptoms = Array.isArray(data.symptoms) 
          ? data.symptoms.join('\n') 
          : (data.symptoms || '');
        const causes = Array.isArray(data.causes) 
          ? data.causes.join('\n') 
          : (data.causes || '');
        const prevention = Array.isArray(data.prevention) 
          ? data.prevention.join('\n') 
          : (data.prevention || '');
        const treatment = Array.isArray(data.treatment) 
          ? data.treatment.join('\n') 
          : (data.treatment || data.treatmentOptions || '');

        return {
          id: docSnap.id,
          diseaseName,
          scientificName,
          category,
          pathogen,
          causalAgent,
          affectedPlants,
          affectedPlantsArray,
          severity,
          description,
          imageUrl,
          symptoms,
          causes,
          prevention,
          treatment,
          raw: data
        };
      });

      setDiseases(loadedDiseases);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching diseases from Firestore:", err);
      setError("Failed to load disease records from Firebase Firestore.");
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

  // Compute dynamic category list showing ONLY categories present in existing Firestore records
  const existingCategories = Array.from(
    new Set(
      diseases
        .map(d => (d.category ? String(d.category).trim() : ''))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const allCategories = ['All Categories', ...existingCategories];

  // Filtered Diseases computation across multiple search fields locally
  const filteredDiseases = diseases.filter((dis) => {
    if (selectedCategory !== 'All Categories') {
      const disCat = dis.category ? String(dis.category).trim().toLowerCase() : '';
      const selCat = String(selectedCategory).trim().toLowerCase();
      if (disCat !== selCat) {
        return false;
      }
    }

    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      (dis.diseaseName && dis.diseaseName.toLowerCase().includes(searchLower)) ||
      (dis.scientificName && dis.scientificName.toLowerCase().includes(searchLower)) ||
      (dis.category && dis.category.toLowerCase().includes(searchLower)) ||
      (dis.affectedPlants && dis.affectedPlants.toLowerCase().includes(searchLower)) ||
      (dis.pathogen && dis.pathogen.toLowerCase().includes(searchLower)) ||
      (dis.causalAgent && dis.causalAgent.toLowerCase().includes(searchLower)) ||
      (dis.description && dis.description.toLowerCase().includes(searchLower)) ||
      (dis.symptoms && dis.symptoms.toLowerCase().includes(searchLower)) ||
      (dis.causes && dis.causes.toLowerCase().includes(searchLower))
    );
  });

  // Reset Form
  const resetFormState = () => {
    setFormValues({
      diseaseName: '',
      scientificName: '',
      category: 'Fungal',
      description: '',
      pathogen: '',
      causalAgent: '',
      affectedPlants: [],
      severity: 'Moderate',
      symptoms: '',
      causes: '',
      prevention: '',
      treatment: '',
      imageUrl: ''
    });
    setPlantSearchTerm('');
    setIsPlantDropdownOpen(false);
    setFormError(null);
    setFormSuccess(null);
    setSelectedDisease(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    resetFormState();
    setShowAddModal(true);
  };

  // Open View Modal
  const handleOpenView = (disease) => {
    setSelectedDisease(disease);
    setShowViewModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (disease) => {
    resetFormState();
    setSelectedDisease(disease);

    const rawData = disease.raw || {};
    const rawPlants = rawData.affectedPlants ?? rawData.hostPlants ?? rawData.plants ?? disease.affectedPlantsArray ?? disease.affectedPlants;
    const initialAffectedPlants = extractPlantsArray(rawPlants);

    setFormValues({
      diseaseName: disease.diseaseName || '',
      scientificName: disease.scientificName !== 'N/A' ? disease.scientificName : '',
      category: disease.category || 'Fungal',
      description: disease.description || '',
      pathogen: disease.pathogen || '',
      causalAgent: disease.causalAgent || disease.pathogen || '',
      affectedPlants: initialAffectedPlants,
      severity: disease.severity || 'Moderate',
      symptoms: disease.symptoms || '',
      causes: disease.causes || '',
      prevention: disease.prevention || '',
      treatment: disease.treatment || '',
      imageUrl: disease.imageUrl || ''
    });
    setShowEditModal(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (disease) => {
    setSelectedDisease(disease);
    setShowDeleteModal(true);
  };

  // Build payload for save/update operations preserving standard and legacy fields
  const buildPayload = () => {
    const dName = formValues.diseaseName.trim();
    const cat = formValues.category.trim();

    const affectedPlantsArray = Array.isArray(formValues.affectedPlants)
      ? formValues.affectedPlants.map(s => String(s).trim()).filter(Boolean)
      : [];

    const symptomsArray = formValues.symptoms.trim() 
      ? formValues.symptoms.trim().split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const causesArray = formValues.causes.trim() 
      ? formValues.causes.trim().split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const preventionArray = formValues.prevention.trim() 
      ? formValues.prevention.trim().split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const treatmentArray = formValues.treatment.trim() 
      ? formValues.treatment.trim().split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      diseaseName: dName,
      name: dName,
      title: dName,
      scientificName: formValues.scientificName.trim(),
      category: cat,
      diseaseType: cat,
      description: formValues.description.trim(),
      overview: formValues.description.trim(),
      pathogen: formValues.pathogen.trim(),
      causalAgent: formValues.causalAgent.trim() || formValues.pathogen.trim(),
      affectedPlants: affectedPlantsArray,
      severity: formValues.severity,
      symptoms: symptomsArray,
      causes: causesArray,
      prevention: preventionArray,
      treatment: treatmentArray,
      treatmentOptions: treatmentArray,
      imageUrl: formValues.imageUrl.trim(),
      image: formValues.imageUrl.trim()
    };

    if (selectedDisease?.raw?.hostPlants !== undefined) {
      payload.hostPlants = affectedPlantsArray;
    }
    if (selectedDisease?.raw?.plants !== undefined) {
      payload.plants = affectedPlantsArray;
    }

    return payload;
  };

  // Handle Add Disease Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const dName = formValues.diseaseName.trim();
    const cat = formValues.category.trim();

    if (!dName) {
      setFormError("Disease Name is required.");
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

      await addDoc(collection(db, 'diseases'), payload);

      setFormSuccess("New disease record added successfully to Firestore!");
      setTimeout(() => {
        setShowAddModal(false);
        resetFormState();
      }, 1200);
    } catch (err) {
      console.error("Error adding disease to Firestore:", err);
      setFormError(err.message || "Failed to save new disease record to Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit Disease Submit (merges with existing doc to preserve unknown fields)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDisease) return;

    setFormError(null);
    setFormSuccess(null);

    const dName = formValues.diseaseName.trim();
    const cat = formValues.category.trim();

    if (!dName) {
      setFormError("Disease Name is required.");
      return;
    }
    if (!cat) {
      setFormError("Category is required.");
      return;
    }

    setIsSaving(true);

    try {
      const diseaseDocRef = doc(db, 'diseases', selectedDisease.id);
      const payload = buildPayload();

      await setDoc(diseaseDocRef, payload, { merge: true });

      setFormSuccess("Disease record updated successfully in Firestore!");
      setTimeout(() => {
        setShowEditModal(false);
        resetFormState();
      }, 1200);
    } catch (err) {
      console.error("Error updating disease in Firestore:", err);
      setFormError(err.message || "Failed to update disease in Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedDisease) return;

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'diseases', selectedDisease.id));
      setShowDeleteModal(false);
      setSelectedDisease(null);
    } catch (err) {
      console.error("Error deleting disease from Firestore:", err);
      alert(err.message || "Failed to delete disease from Firestore.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper renderer for Form Sections
  const renderFormFields = () => (
    <div className="space-y-6">
      
      {/* 1. Disease Information */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          <span>1. Disease Information</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Disease Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formValues.diseaseName}
              onChange={(e) => setFormValues(prev => ({ ...prev, diseaseName: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="e.g. Black Spot / Powdery Mildew"
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
              placeholder="e.g. Diplocarpon rosae"
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
              <option value="Fungal">Fungal</option>
              <option value="Bacterial">Bacterial</option>
              <option value="Viral">Viral</option>
              <option value="Pest-related">Pest-related</option>
              <option value="Environmental">Environmental</option>
              <option value="Nutrient">Nutrient</option>
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
              placeholder="Overview of the disease symptoms and impact..."
            />
          </div>
        </div>
      </div>

      {/* 2. Cause */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <Bug className="w-3.5 h-3.5" />
          <span>2. Cause & Pathogen</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Pathogen
            </label>
            <input
              type="text"
              value={formValues.pathogen}
              onChange={(e) => setFormValues(prev => ({ ...prev, pathogen: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="e.g. Fungus, Bacterium, Virus"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Causal Agent
            </label>
            <input
              type="text"
              value={formValues.causalAgent}
              onChange={(e) => setFormValues(prev => ({ ...prev, causalAgent: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="e.g. Specific organism or agent"
            />
          </div>
        </div>
      </div>

      {/* 3. Affected Plants */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>3. Affected Plants</span>
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

      {/* 4. Symptoms & Severity */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>4. Symptoms & Severity</span>
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

          <div className="space-y-1 sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Symptoms (One item per line)
            </label>
            <textarea
              rows={2}
              value={formValues.symptoms}
              onChange={(e) => setFormValues(prev => ({ ...prev, symptoms: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="Black spots on leaves&#10;Yellowing lower foliage"
            />
          </div>
        </div>
      </div>

      {/* 5. Management */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>5. Management & Treatment</span>
        </h4>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Causes (One item per line)
            </label>
            <textarea
              rows={2}
              value={formValues.causes}
              onChange={(e) => setFormValues(prev => ({ ...prev, causes: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="High humidity&#10;Poor air circulation"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Prevention (One item per line)
            </label>
            <textarea
              rows={2}
              value={formValues.prevention}
              onChange={(e) => setFormValues(prev => ({ ...prev, prevention: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="Water at the base of plants&#10;Maintain adequate spacing"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Treatment (One item per line)
            </label>
            <textarea
              rows={2}
              value={formValues.treatment}
              onChange={(e) => setFormValues(prev => ({ ...prev, treatment: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              placeholder="Apply organic copper fungicide&#10;Prune infected stems"
            />
          </div>
        </div>
      </div>

      {/* 6. Image */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#16883D] dark:text-[#22C55E] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#2A2E36] pb-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>6. Image</span>
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
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            <span>Manage Diseases</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Add, edit or delete disease diagnostic knowledge-base records in Firestore.
          </p>
        </div>

        {/* Add New Disease Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#16883D] text-[#16883D] dark:text-[#22C55E] dark:border-[#22C55E] hover:bg-[#16883D] hover:text-white dark:hover:bg-[#16883D] dark:hover:text-white font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Disease</span>
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
              Search Disease
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by disease name, scientific name, plants, symptoms, pathogen..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Disease Category Filter
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
                <th className="py-3 px-4">Disease Image</th>
                <th className="py-3 px-4">Disease Name</th>
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
                        Loading disease records from Firebase...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredDiseases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      
                      {/* Empty State Graphic */}
                      <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center shadow-sm">
                        <ShieldAlert className="w-8 h-8 stroke-[2]" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          No diseases found
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {searchTerm || selectedCategory !== 'All Categories'
                            ? "No disease records match your search and category criteria."
                            : "There are no disease records stored in the database yet."}
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                filteredDiseases.map((disease, idx) => (
                  <tr key={disease.id || idx} className="border-t border-slate-100 dark:border-[#2A2E36] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium">{idx + 1}</td>
                    
                    {/* Disease Thumbnail */}
                    <td className="py-3.5 px-4">
                      {disease.imageUrl ? (
                        <img 
                          src={disease.imageUrl} 
                          alt={disease.diseaseName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                          onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center">
                          <ShieldAlert className="w-5 h-5 stroke-[2]" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{disease.diseaseName}</div>
                      {disease.scientificName && disease.scientificName !== 'N/A' && (
                        <div className="text-[10px] text-slate-400 italic">{disease.scientificName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        {disease.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {disease.affectedPlants || 'All Plants'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        disease.severity === 'High' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                        disease.severity === 'Low' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                        'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {disease.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {disease.description || 'No description provided.'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenView(disease)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1"
                          title="View Disease Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(disease)}
                          className="px-2.5 py-1 rounded-lg bg-[#EAF6E8] dark:bg-[#132B1F] hover:bg-[#d8edd4] dark:hover:bg-[#1b3d2b] text-[#16883D] dark:text-[#22C55E] text-xs font-bold transition-all flex items-center gap-1"
                          title="Edit Disease"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(disease)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1"
                          title="Delete Disease"
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
        <span>All disease data added here will be available to users in the plant disease detection and treatment modules.</span>
      </div>

      {/* ADD DISEASE MODAL */}
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
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-red-500 flex items-center justify-center mb-2">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Add New Disease Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Add plant disease specifications to the Firestore knowledge base.
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
                    <span>Save Disease</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* EDIT DISEASE MODAL */}
      {showEditModal && selectedDisease && (
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
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-red-500 flex items-center justify-center mb-2">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Edit Disease Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Update disease knowledge base details and symptoms.
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
      {showDeleteModal && selectedDisease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5">
            
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Delete Disease Record?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{selectedDisease.diseaseName}"</span> from the disease knowledge base?
              </p>
              <p className="text-[11px] text-slate-400">
                This will permanently delete this record from the disease knowledge base. User analysis history and disease follow-ups will not be affected.
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

      {/* VIEW DISEASE DETAILS MODAL (READ-ONLY) */}
      {showViewModal && selectedDisease && (
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
              {selectedDisease.imageUrl ? (
                <img 
                  src={selectedDisease.imageUrl} 
                  alt={selectedDisease.diseaseName}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                  onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-8 h-8 stroke-[2]" />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    {selectedDisease.category || 'Fungal'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    selectedDisease.severity === 'High' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                    selectedDisease.severity === 'Low' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                    'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}>
                    Severity: {selectedDisease.severity || 'Moderate'}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedDisease.diseaseName}
                </h3>
                {selectedDisease.scientificName && selectedDisease.scientificName !== 'N/A' && (
                  <p className="text-xs text-slate-400 italic">
                    {selectedDisease.scientificName}
                  </p>
                )}
              </div>
            </div>

            {/* Disease details body */}
            <div className="space-y-5 border-t border-slate-100 dark:border-[#2A2E36] pt-5">
              
              {/* Pathogen / Causal Agent */}
              {(selectedDisease.pathogen || selectedDisease.causalAgent) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    Pathogen / Causal Agent
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
                    {selectedDisease.pathogen || selectedDisease.causalAgent}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Overview & Description
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedDisease.description || 'No description available for this disease record.'}
                </p>
              </div>

              {/* Affected Plants */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                  Affected Plants
                </h4>
                {selectedDisease.affectedPlantsArray && selectedDisease.affectedPlantsArray.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDisease.affectedPlantsArray.map((plant, pIdx) => (
                      <span key={pIdx} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
                        {plant}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {selectedDisease.affectedPlants || 'All susceptible plant species.'}
                  </p>
                )}
              </div>

              {/* Symptoms */}
              {selectedDisease.symptoms && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Symptoms
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedDisease.symptoms}
                  </p>
                </div>
              )}

              {/* Causes */}
              {selectedDisease.causes && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    Causes & Favorable Conditions
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedDisease.causes}
                  </p>
                </div>
              )}

              {/* Prevention */}
              {selectedDisease.prevention && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    Prevention & Proactive Care
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedDisease.prevention}
                  </p>
                </div>
              )}

              {/* Treatment */}
              {selectedDisease.treatment && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-500" />
                    Recommended Treatment
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedDisease.treatment}
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
                  handleOpenEdit(selectedDisease);
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

export default AdminDiseases;

