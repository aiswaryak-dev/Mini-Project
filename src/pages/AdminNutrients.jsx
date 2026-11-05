import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
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
  CheckCircle2, 
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

export const AdminNutrients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [deficiencyType, setDeficiencyType] = useState('All Types');
  const [deficiencies, setDeficiencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availablePlants, setAvailablePlants] = useState(CANONICAL_PLANTS);

  // Modal Visibility States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Active Selected Item & Action States
  const [selectedNutrient, setSelectedNutrient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState(null);

  const initialFormState = {
    nutrientName: '',
    nutrientSymbol: '',
    deficiencyName: '',
    category: 'Kitchen Garden',
    deficiencyType: 'Macronutrient',
    description: '',
    symptoms: '',
    affectedParts: 'Foliage',
    severity: 'Moderate',
    causes: '',
    prevention: '',
    treatment: '',
    affectedPlants: [],
    imageUrl: ''
  };

  const [formValues, setFormValues] = useState(initialFormState);

  // Real-time listener for 'nutrients' collection
  useEffect(() => {
    setLoading(true);
    const nutrientsRef = collection(db, 'nutrients');
    const unsubscribe = onSnapshot(nutrientsRef, (snapshot) => {
      const loaded = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          nutrientName: data.nutrientName || data.name || 'N/A',
          nutrientSymbol: data.nutrientSymbol || '',
          deficiencyName: data.deficiencyName || `${data.nutrientName || 'Nutrient'} Deficiency`,
          category: data.category || 'Kitchen Garden',
          type: data.deficiencyType || data.type || 'Macronutrient',
          description: data.description || '',
          symptoms: data.symptoms || [],
          affectedPlants: data.affectedPlants || [],
          raw: data
        };
      });
      setDeficiencies(loaded);
      setLoading(false);
    }, (err) => {
      console.error("Error loading nutrients from Firestore:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch plant species list for affectedPlants selector if present
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

  // Filtered Deficiencies
  const filteredDeficiencies = deficiencies.filter((item) => {
    if (category !== 'All Categories' && item.category !== category) return false;
    if (deficiencyType !== 'All Types' && item.type !== deficiencyType) return false;

    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;

    return (
      item.nutrientName.toLowerCase().includes(term) ||
      item.deficiencyName.toLowerCase().includes(term) ||
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
    setSelectedNutrient(item);
    const raw = item.raw || {};
    setFormValues({
      nutrientName: item.nutrientName || '',
      nutrientSymbol: item.nutrientSymbol || raw.nutrientSymbol || '',
      deficiencyName: item.deficiencyName || '',
      category: item.category || 'Kitchen Garden',
      deficiencyType: item.type || 'Macronutrient',
      description: item.description || '',
      symptoms: Array.isArray(raw.symptoms) ? raw.symptoms.join('\n') : (raw.symptoms || ''),
      affectedParts: raw.affectedParts || 'Foliage',
      severity: raw.severity || 'Moderate',
      causes: Array.isArray(raw.causes) ? raw.causes.join('\n') : (raw.causes || ''),
      prevention: Array.isArray(raw.prevention) ? raw.prevention.join('\n') : (raw.prevention || ''),
      treatment: Array.isArray(raw.treatment) ? raw.treatment.join('\n') : (raw.treatment || ''),
      affectedPlants: Array.isArray(item.affectedPlants) ? item.affectedPlants : [],
      imageUrl: raw.imageUrl || raw.image || ''
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedNutrient(item);
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

    const cleanName = formValues.nutrientName.trim();
    const cleanDefName = formValues.deficiencyName.trim();

    if (!cleanName || !cleanDefName) {
      setFormError("Nutrient Name and Deficiency Name are required.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        nutrientName: cleanName,
        nutrientSymbol: formValues.nutrientSymbol.trim(),
        deficiencyName: cleanDefName,
        category: formValues.category,
        deficiencyType: formValues.deficiencyType,
        type: formValues.deficiencyType,
        description: formValues.description.trim(),
        symptoms: formValues.symptoms.split('\n').map(s => s.trim()).filter(Boolean),
        affectedParts: formValues.affectedParts.trim() || 'Foliage',
        severity: formValues.severity,
        causes: formValues.causes.split('\n').map(c => c.trim()).filter(Boolean),
        prevention: formValues.prevention.split('\n').map(p => p.trim()).filter(Boolean),
        treatment: formValues.treatment.split('\n').map(t => t.trim()).filter(Boolean),
        affectedPlants: formValues.affectedPlants,
        imageUrl: formValues.imageUrl.trim()
      };

      if (showEditModal && selectedNutrient?.id) {
        await setDoc(doc(db, 'nutrients', selectedNutrient.id), payload, { merge: true });
        setShowEditModal(false);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'nutrients'), payload);
        setShowAddModal(false);
      }

      setFormValues(initialFormState);
      setSelectedNutrient(null);
    } catch (err) {
      console.error("Error saving nutrient record:", err);
      setFormError("Failed to save nutrient record to database. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNutrient?.id) return;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'nutrients', selectedNutrient.id));
      setShowDeleteModal(false);
      setSelectedNutrient(null);
    } catch (err) {
      console.error("Error deleting nutrient document:", err);
      alert("Failed to delete nutrient record.");
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
            <FlaskConical className="w-6 h-6 stroke-[2.5]" />
            <span>Manage Nutrient Deficiencies</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Add, edit or delete nutrient deficiency information in the system.
          </p>
        </div>

        {/* Add New Deficiency Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#16883D] text-[#16883D] dark:text-[#22C55E] dark:border-[#22C55E] hover:bg-[#16883D] hover:text-white dark:hover:bg-[#16883D] dark:hover:text-white font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Deficiency</span>
        </button>
      </div>

      {/* Search & Filter Card */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-5 border border-slate-100 dark:border-[#2A2E36] shadow-sm transition-colors duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          
          {/* Search Input */}
          <div className="sm:col-span-6 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Search Deficiency
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by nutrient name or deficiency..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              />
            </div>
          </div>

          {/* Affecting Plant Category Dropdown */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Affecting Plant Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All Categories">All Categories</option>
                <option value="Garden Plants">Garden Plants</option>
                <option value="Kitchen Garden">Kitchen Garden</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Deficiency Type Dropdown */}
          <div className="sm:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Deficiency Type
            </label>
            <div className="relative">
              <select
                value={deficiencyType}
                onChange={(e) => setDeficiencyType(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              >
                <option value="All Types">All Types</option>
                <option value="Macronutrient">Macronutrient</option>
                <option value="Micronutrient">Micronutrient</option>
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
                <th className="py-3 px-4">Nutrient Name</th>
                <th className="py-3 px-4">Deficiency Name</th>
                <th className="py-3 px-4">Affecting Plant Category</th>
                <th className="py-3 px-4">Deficiency Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-[#16883D] dark:text-[#22C55E]">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <span className="text-xs font-semibold">Loading nutrient deficiencies...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDeficiencies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      
                      {/* Empty State Vector Graphic */}
                      <div className="w-16 h-16 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shadow-sm">
                        <FlaskConical className="w-8 h-8 stroke-[2]" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          No nutrient deficiencies found
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          There are no nutrient deficiency records matching your filter.
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                filteredDeficiencies.map((item, idx) => (
                  <tr key={item.id || idx} className="border-t border-slate-100 dark:border-[#2A2E36] hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-mono font-medium">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{item.nutrientName}</td>
                    <td className="py-3.5 px-4 font-medium">{item.deficiencyName}</td>
                    <td className="py-3.5 px-4">{item.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === 'Macronutrient' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">{item.description}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedNutrient(item);
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

      {/* View Nutrient Details Modal */}
      {showViewModal && selectedNutrient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-[#2A2E36] my-8 space-y-6 text-xs text-slate-700 dark:text-slate-200">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                  <FlaskConical className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedNutrient.deficiencyName}</span>
                    {(selectedNutrient.nutrientSymbol || selectedNutrient.raw?.nutrientSymbol) && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                        {selectedNutrient.nutrientSymbol || selectedNutrient.raw?.nutrientSymbol}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedNutrient.nutrientName} • {selectedNutrient.type} ({selectedNutrient.category})
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setShowViewModal(false); setSelectedNutrient(null); }}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Optional Image */}
            {(selectedNutrient.raw?.imageUrl || selectedNutrient.raw?.image) && (
              <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-[#3F4452]">
                <img 
                  src={selectedNutrient.raw.imageUrl || selectedNutrient.raw.image} 
                  alt={selectedNutrient.deficiencyName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#222630] border border-slate-200 dark:border-[#3F4452]">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nutrient</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedNutrient.nutrientName}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deficiency Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedNutrient.type}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Affected Parts</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedNutrient.raw?.affectedParts || 'Foliage'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Severity</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{selectedNutrient.raw?.severity || 'Moderate'}</span>
              </div>
            </div>

            {/* Description */}
            {selectedNutrient.description && (
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Description</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedNutrient.description}</p>
              </div>
            )}

            {/* Symptoms */}
            {selectedNutrient.raw?.symptoms && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#16883D] dark:text-[#22C55E]" />
                  <span>Symptoms</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {Array.isArray(selectedNutrient.raw.symptoms) ? (
                    selectedNutrient.raw.symptoms.map((sym, i) => <li key={i}>{sym}</li>)
                  ) : (
                    <li>{String(selectedNutrient.raw.symptoms)}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Causes & Treatment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedNutrient.raw?.causes && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-xs">Causes</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-200">
                    {Array.isArray(selectedNutrient.raw.causes) ? (
                      selectedNutrient.raw.causes.map((c, i) => <li key={i}>{c}</li>)
                    ) : (
                      <li>{String(selectedNutrient.raw.causes)}</li>
                    )}
                  </ul>
                </div>
              )}

              {selectedNutrient.raw?.treatment && (
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">Treatment & Management</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-800 dark:text-emerald-200">
                    {Array.isArray(selectedNutrient.raw.treatment) ? (
                      selectedNutrient.raw.treatment.map((t, i) => <li key={i}>{t}</li>)
                    ) : (
                      <li>{String(selectedNutrient.raw.treatment)}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Affected Plants */}
            {selectedNutrient.affectedPlants && selectedNutrient.affectedPlants.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-[#16883D] dark:text-[#22C55E]" />
                  <span>Affected Plants ({selectedNutrient.affectedPlants.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNutrient.affectedPlants.map((plant, i) => (
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
                onClick={() => { setShowViewModal(false); setSelectedNutrient(null); }}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-[#16883D] text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Nutrient Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-[#2A2E36] my-8 space-y-5 text-xs">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2A2E36] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {showEditModal ? 'Edit Nutrient Deficiency' : 'Add New Nutrient Deficiency'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {showEditModal ? 'Update deficiency details in the database.' : 'Enter details to create a new nutrient record.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedNutrient(null); }}
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
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Nutrient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.nutrientName}
                    onChange={(e) => setFormValues({ ...formValues, nutrientName: e.target.value })}
                    placeholder="e.g. Nitrogen"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={formValues.nutrientSymbol}
                    onChange={(e) => setFormValues({ ...formValues, nutrientSymbol: e.target.value })}
                    placeholder="e.g. N"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Deficiency Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.deficiencyName}
                    onChange={(e) => setFormValues({ ...formValues, deficiencyName: e.target.value })}
                    placeholder="e.g. Nitrogen (N) Deficiency"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    Deficiency Type
                  </label>
                  <select
                    value={formValues.deficiencyType}
                    onChange={(e) => setFormValues({ ...formValues, deficiencyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  >
                    <option value="Macronutrient">Macronutrient</option>
                    <option value="Micronutrient">Micronutrient</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Severity Level
                  </label>
                  <select
                    value={formValues.severity}
                    onChange={(e) => setFormValues({ ...formValues, severity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  >
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formValues.description}
                  onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                  placeholder="Provide brief overview of deficiency..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Symptoms (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formValues.symptoms}
                    onChange={(e) => setFormValues({ ...formValues, symptoms: e.target.value })}
                    placeholder="e.g. Older leaves turn yellow&#10;Stunted plant growth"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Treatment & Care (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formValues.treatment}
                    onChange={(e) => setFormValues({ ...formValues, treatment: e.target.value })}
                    placeholder="e.g. Apply NPK fertilizer&#10;Foliar spray with fish emulsion"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formValues.imageUrl}
                  onChange={(e) => setFormValues({ ...formValues, imageUrl: e.target.value })}
                  placeholder="https://images.pexels.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium outline-none focus:ring-2 focus:ring-[#16883D]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Affected Plants
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
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelectedNutrient(null); }}
                  className="px-5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#16883D] hover:bg-[#127132] text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{showEditModal ? 'Update Deficiency' : 'Save Deficiency'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedNutrient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-[#2A2E36] space-y-5 text-xs text-center">
            
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Delete Nutrient Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-100">"{selectedNutrient.deficiencyName}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setSelectedNutrient(null); }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Document</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bottom Info Banner */}
      <div className="bg-[#EAF6E8]/70 dark:bg-[#132B1F] border border-[#16883D]/20 dark:border-[#22C55E]/20 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#063D24] dark:text-[#22C55E] font-semibold">
        <Info className="w-5 h-5 shrink-0" />
        <span>All nutrient deficiency data added here will be available to users in the nutrient analysis module and encyclopedia.</span>
      </div>

    </div>
  );
};
