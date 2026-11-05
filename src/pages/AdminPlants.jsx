import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Plus, 
  Search, 
  Filter, 
  Info, 
  ChevronDown, 
  Edit3, 
  Trash2, 
  Eye,
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Image as ImageIcon,
  Sun,
  Droplets,
  Thermometer,
  Layers
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
import { getPlantImage } from '../utils/plantAssets';

export const AdminPlants = () => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Active form/selected item states
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Form Fields State
  const [formValues, setFormValues] = useState({
    commonName: '',
    scientificName: '',
    category: 'Garden Plants',
    description: '',
    imageUrl: '',
    watering: '',
    sunlight: '',
    soil: '',
    temperature: '',
    humidity: '',
    careInstructions: ''
  });

  // Real-time listener for 'plants' collection
  useEffect(() => {
    setLoading(true);
    setError(null);

    const plantsRef = collection(db, 'plants');
    const unsubscribe = onSnapshot(plantsRef, (snapshot) => {
      try {
        const loadedPlants = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const commonName = data.commonName || data.name || data.plantName || 'Unnamed Plant';
          const scientificName = data.scientificName || data.species || 'N/A';
          const category = data.category || data.plantCategory || 'Garden Plants';
          const description = data.description || data.notes || '';
          const rawImageUrl = data.imageUrl || data.image || data.imageURL || '';
          const imageUrl = getPlantImage(docSnap.id || commonName, rawImageUrl);
          const watering = data.watering || (typeof data.water === 'string' ? data.water : data.water?.guidance) || '';
          const sunlight = data.sunlight || (typeof data.sunlight === 'string' ? data.sunlight : data.sunlight?.preferred) || '';
          const soil = data.soil || (typeof data.soil === 'string' ? data.soil : data.soil?.preferredType) || '';
          const temperature = data.temperature || (typeof data.temp === 'string' ? data.temp : data.temp ? `${data.temp}°C` : '') || '';
          const humidity = data.humidity ? `${data.humidity}%` : '';

          return {
            id: docSnap.id,
            commonName,
            scientificName,
            category,
            description,
            imageUrl,
            watering,
            sunlight,
            soil,
            temperature,
            humidity,
            raw: data
          };
        });

        setPlants(loadedPlants);
        setError(null);
      } catch (err) {
        console.error("Error processing plant records snapshot:", err);
        setError("Unable to load plant records from Firebase. Please check Firebase connection or permissions.");
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Error fetching plants from Firestore:", err);
      setError("Unable to load plant records from Firebase. Please check Firebase connection or permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Category options for filter dropdown
  const allCategories = ['All Categories', 'Garden Plants', 'Kitchen Garden'];

  // Filtered Plants computation
  const filteredPlants = plants.filter((plant) => {
    // Category matching
    if (selectedCategory !== 'All Categories' && plant.category !== selectedCategory) {
      return false;
    }

    // Search matching
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      plant.commonName.toLowerCase().includes(searchLower) ||
      plant.scientificName.toLowerCase().includes(searchLower) ||
      plant.category.toLowerCase().includes(searchLower) ||
      plant.description.toLowerCase().includes(searchLower)
    );
  });

  // Reset Form
  const resetFormState = () => {
    setFormValues({
      commonName: '',
      scientificName: '',
      category: 'Garden Plants',
      description: '',
      imageUrl: '',
      watering: '',
      sunlight: '',
      soil: '',
      temperature: '',
      humidity: '',
      careInstructions: ''
    });
    setFormError(null);
    setFormSuccess(null);
    setSelectedPlant(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    resetFormState();
    setShowAddModal(true);
  };

  // Open View Modal
  const handleOpenView = (plant) => {
    setSelectedPlant(plant);
    setShowViewModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (plant) => {
    resetFormState();
    setSelectedPlant(plant);
    setFormValues({
      commonName: plant.commonName,
      scientificName: plant.scientificName !== 'N/A' ? plant.scientificName : '',
      category: plant.category || 'Garden Plants',
      description: plant.description || '',
      imageUrl: plant.imageUrl || '',
      watering: plant.watering || '',
      sunlight: plant.sunlight || '',
      soil: plant.soil || '',
      temperature: plant.temperature || '',
      humidity: plant.humidity || '',
      careInstructions: Array.isArray(plant.raw?.careInstructions) 
        ? plant.raw.careInstructions.join('\n') 
        : (plant.raw?.careInstructions || '')
    });
    setShowEditModal(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (plant) => {
    setSelectedPlant(plant);
    setShowDeleteModal(true);
  };

  // Helper to validate image URL or app asset path
  const isValidImageUrl = (url) => {
    if (!url || !url.trim()) return true;
    const val = url.trim();
    if (/^(javascript|vbscript|data:(?!image\/)):/i.test(val)) {
      return false;
    }
    return true;
  };

  // Handle Add Plant Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cName = formValues.commonName.trim();
    const sName = formValues.scientificName.trim();
    const cat = formValues.category.trim();

    if (!cName) {
      setFormError("Common Name is required.");
      return;
    }
    if (!sName) {
      setFormError("Scientific Name is required.");
      return;
    }
    if (!cat) {
      setFormError("Category is required.");
      return;
    }
    if (!isValidImageUrl(formValues.imageUrl)) {
      setFormError("Please enter a valid image URL or image asset path.");
      return;
    }

    setIsSaving(true);

    try {
      const newPlantPayload = {
        commonName: cName,
        name: cName,
        scientificName: sName,
        species: sName,
        category: cat,
        description: formValues.description.trim(),
        notes: formValues.description.trim(),
        imageUrl: formValues.imageUrl.trim(),
        image: formValues.imageUrl.trim(),
        watering: formValues.watering.trim(),
        sunlight: formValues.sunlight.trim(),
        soil: formValues.soil.trim(),
        temperature: formValues.temperature.trim(),
        humidity: formValues.humidity.trim(),
        careInstructions: formValues.careInstructions.trim() 
          ? formValues.careInstructions.trim().split('\n').filter(Boolean)
          : [],
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'plants'), newPlantPayload);

      setFormSuccess("New plant knowledge record added successfully!");
      setTimeout(() => {
        setShowAddModal(false);
        resetFormState();
      }, 1200);
    } catch (err) {
      console.error("Error adding plant to Firestore:", err);
      setFormError(err.message || "Failed to save new plant to Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Edit Plant Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlant) return;

    setFormError(null);
    setFormSuccess(null);

    const cName = formValues.commonName.trim();
    const sName = formValues.scientificName.trim();
    const cat = formValues.category.trim();

    if (!cName) {
      setFormError("Common Name is required.");
      return;
    }
    if (!sName) {
      setFormError("Scientific Name is required.");
      return;
    }
    if (!cat) {
      setFormError("Category is required.");
      return;
    }
    if (!isValidImageUrl(formValues.imageUrl)) {
      setFormError("Please enter a valid image URL or image asset path.");
      return;
    }

    setIsSaving(true);

    try {
      const plantDocRef = doc(db, 'plants', selectedPlant.id);
      
      const updatePayload = {
        commonName: cName,
        name: cName,
        scientificName: sName,
        species: sName,
        category: cat,
        description: formValues.description.trim(),
        notes: formValues.description.trim(),
        imageUrl: formValues.imageUrl.trim(),
        image: formValues.imageUrl.trim(),
        watering: formValues.watering.trim(),
        sunlight: formValues.sunlight.trim(),
        soil: formValues.soil.trim(),
        temperature: formValues.temperature.trim(),
        humidity: formValues.humidity.trim(),
        careInstructions: formValues.careInstructions.trim() 
          ? formValues.careInstructions.trim().split('\n').filter(Boolean)
          : []
      };

      await setDoc(plantDocRef, updatePayload, { merge: true });

      setFormSuccess("Plant record updated successfully in Firestore!");
      setTimeout(() => {
        setShowEditModal(false);
        resetFormState();
      }, 1200);
    } catch (err) {
      console.error("Error updating plant in Firestore:", err);
      setFormError(err.message || "Failed to update plant in Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedPlant) return;

    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'plants', selectedPlant.id));
      setShowDeleteModal(false);
      setSelectedPlant(null);
    } catch (err) {
      console.error("Error deleting plant from Firestore:", err);
      alert(err.message || "Failed to delete plant from Firestore.");
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
            <Sprout className="w-6 h-6 stroke-[2.5]" />
            <span>Manage Plants</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            View, add, edit or delete plant knowledge-base records in Firestore.
          </p>
        </div>

        {/* Add New Plant Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-[#16883D] text-[#16883D] dark:text-[#22C55E] dark:border-[#22C55E] hover:bg-[#16883D] hover:text-white dark:hover:bg-[#16883D] dark:hover:text-white font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Plant</span>
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
              Search Plant
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by common name, scientific name or category..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-white dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-5 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Category Filter
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
                <th className="py-3 px-4">Plant Image</th>
                <th className="py-3 px-4">Common Name</th>
                <th className="py-3 px-4">Scientific Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
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
                        Loading plant records from Firebase...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredPlants.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      
                      {/* Empty State Vector Graphic */}
                      <div className="w-16 h-16 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shadow-sm">
                        <Sprout className="w-8 h-8 stroke-[2]" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          No plants found
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {searchTerm || selectedCategory !== 'All Categories'
                            ? "No plants match your search and category criteria."
                            : "There are no plant records stored in the database yet."}
                        </p>
                      </div>

                    </div>
                  </td>
                </tr>
              ) : (
                filteredPlants.map((plant, idx) => (
                  <tr key={plant.id || idx} className="border-t border-slate-100 dark:border-[#2A2E36] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium">{idx + 1}</td>
                    
                    {/* Plant Thumbnail */}
                    <td className="py-3.5 px-4">
                      {plant.imageUrl ? (
                        <img 
                          src={plant.imageUrl} 
                          alt={plant.commonName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                          onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center">
                          <Sprout className="w-5 h-5 stroke-[2]" />
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100">{plant.commonName}</td>
                    <td className="py-3.5 px-4 italic text-slate-600 dark:text-slate-300">{plant.scientificName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                        {plant.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {plant.description || 'No description provided.'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenView(plant)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all flex items-center gap-1"
                          title="View Plant Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(plant)}
                          className="px-2.5 py-1 rounded-lg bg-[#EAF6E8] dark:bg-[#132B1F] hover:bg-[#d8edd4] dark:hover:bg-[#1b3d2b] text-[#16883D] dark:text-[#22C55E] text-xs font-bold transition-all flex items-center gap-1"
                          title="Edit Plant"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(plant)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all flex items-center gap-1"
                          title="Delete Plant"
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
        <span>All plant data added here will be available to users in the Plant Encyclopedia and identification modules.</span>
      </div>

      {/* ADD PLANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5 my-8">
            
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
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Add New Plant Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Add botanical specifications to the Firestore plant database.
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

            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Common Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Common Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.commonName}
                    onChange={(e) => setFormValues(prev => ({ ...prev, commonName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                    placeholder="e.g. Rose / Golden Pothos"
                  />
                </div>

                {/* Scientific Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Scientific Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.scientificName}
                    onChange={(e) => setFormValues(prev => ({ ...prev, scientificName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                    placeholder="e.g. Rosa spp."
                  />
                </div>

                {/* Category */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formValues.category}
                    onChange={(e) => setFormValues(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                  >
                    <option value="Garden Plants">Garden Plants</option>
                    <option value="Kitchen Garden">Kitchen Garden</option>
                  </select>
                </div>

                {/* Image URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Image URL
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={formValues.imageUrl}
                      onChange={(e) => setFormValues(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                      placeholder="https://images.unsplash.com/... or /src/assets/rose.jpg"
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

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Description & Overview
                  </label>
                  <textarea
                    rows={2}
                    value={formValues.description}
                    onChange={(e) => setFormValues(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                    placeholder="Short description of the plant..."
                  />
                </div>

                {/* Care Parameters */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Watering</label>
                  <input
                    type="text"
                    value={formValues.watering}
                    onChange={(e) => setFormValues(prev => ({ ...prev, watering: e.target.value }))}
                    placeholder="e.g. 1-2 times/week"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Sunlight</label>
                  <input
                    type="text"
                    value={formValues.sunlight}
                    onChange={(e) => setFormValues(prev => ({ ...prev, sunlight: e.target.value }))}
                    placeholder="e.g. Full Sun (6-8 hours)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Soil Type</label>
                  <input
                    type="text"
                    value={formValues.soil}
                    onChange={(e) => setFormValues(prev => ({ ...prev, soil: e.target.value }))}
                    placeholder="e.g. Well-draining loamy soil"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Temperature</label>
                  <input
                    type="text"
                    value={formValues.temperature}
                    onChange={(e) => setFormValues(prev => ({ ...prev, temperature: e.target.value }))}
                    placeholder="e.g. 18°C - 28°C"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs"
                  />
                </div>

                {/* Care Instructions */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Care Instructions (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={formValues.careInstructions}
                    onChange={(e) => setFormValues(prev => ({ ...prev, careInstructions: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                    placeholder="Water at soil level early in the morning&#10;Prune dead stems in early spring"
                  />
                </div>

              </div>

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
                    <span>Save Plant</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT PLANT MODAL */}
      {showEditModal && selectedPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5 my-8">
            
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
              <div className="w-10 h-10 rounded-full bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center mb-2">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Edit Plant Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Update Firestore document ID: <span className="font-mono text-slate-600 dark:text-slate-300">{selectedPlant.id}</span>
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

            <form onSubmit={handleEditSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Common Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Common Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.commonName}
                    onChange={(e) => setFormValues(prev => ({ ...prev, commonName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>

                {/* Scientific Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Scientific Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValues.scientificName}
                    onChange={(e) => setFormValues(prev => ({ ...prev, scientificName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formValues.category}
                    onChange={(e) => setFormValues(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                  >
                    <option value="Garden Plants">Garden Plants</option>
                    <option value="Kitchen Garden">Kitchen Garden</option>
                  </select>
                </div>

                {/* Image URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Image URL
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={formValues.imageUrl}
                      onChange={(e) => setFormValues(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                      placeholder="https://images.unsplash.com/... or /src/assets/rose.jpg"
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

                {/* Description */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Description & Overview
                  </label>
                  <textarea
                    rows={2}
                    value={formValues.description}
                    onChange={(e) => setFormValues(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#16883D]"
                  />
                </div>

                {/* Care Parameters */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Watering</label>
                  <input
                    type="text"
                    value={formValues.watering}
                    onChange={(e) => setFormValues(prev => ({ ...prev, watering: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Sunlight</label>
                  <input
                    type="text"
                    value={formValues.sunlight}
                    onChange={(e) => setFormValues(prev => ({ ...prev, sunlight: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3F4452] bg-slate-50 dark:bg-[#222630] text-xs"
                  />
                </div>

              </div>

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
      {showDeleteModal && selectedPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-5">
            
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Delete Plant Record?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{selectedPlant.commonName}"</span> from the plant knowledge base?
              </p>
              <p className="text-[11px] text-slate-400">
                This will remove only the document <span className="font-mono text-slate-500">plants/{selectedPlant.id}</span>. Unrelated user analysis records will be preserved.
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

      {/* VIEW PLANT DETAILS READ-ONLY MODAL */}
      {showViewModal && selectedPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-[#2A2E36] relative space-y-6 my-8 text-xs text-slate-700 dark:text-slate-200">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => { setShowViewModal(false); setSelectedPlant(null); }}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4">
              {selectedPlant.imageUrl ? (
                <img 
                  src={selectedPlant.imageUrl} 
                  alt={selectedPlant.commonName}
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E] flex items-center justify-center shrink-0">
                  <Sprout className="w-10 h-10 stroke-[2]" />
                </div>
              )}
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6E8] dark:bg-[#132B1F] text-[#16883D] dark:text-[#22C55E]">
                  {selectedPlant.category}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {selectedPlant.commonName}
                </h3>
                <p className="text-xs italic text-slate-500 dark:text-slate-400 font-medium">
                  {selectedPlant.scientificName}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedPlant.description && (
              <div className="space-y-1 bg-slate-50 dark:bg-[#222630] p-4 rounded-2xl border border-slate-200 dark:border-[#3F4452]">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Description & Overview</h4>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedPlant.description}</p>
              </div>
            )}

            {/* Plant Care Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
                <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Watering
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{selectedPlant.watering || 'N/A'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Sunlight
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{selectedPlant.sunlight || 'N/A'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Soil
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{selectedPlant.soil || 'N/A'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 space-y-1">
                <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider block flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Temperature
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{selectedPlant.temperature || 'N/A'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 space-y-1">
                <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Humidity
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100 block">{selectedPlant.humidity || 'N/A'}</span>
              </div>
            </div>

            {/* Care Instructions */}
            {selectedPlant.raw?.careInstructions && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-[#222630] border border-slate-200 dark:border-[#3F4452]">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Care Instructions</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {Array.isArray(selectedPlant.raw.careInstructions) ? (
                    selectedPlant.raw.careInstructions.map((inst, i) => <li key={i}>{inst}</li>)
                  ) : (
                    <li>{String(selectedPlant.raw.careInstructions)}</li>
                  )}
                </ul>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-[#2A2E36]">
              <button
                type="button"
                onClick={() => { setShowViewModal(false); setSelectedPlant(null); }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#16883D] text-white font-bold text-xs transition-all shadow-md active:scale-95"
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
