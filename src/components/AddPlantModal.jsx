import React, { useState } from 'react';
import { X, Sprout, Image, Sliders, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

const PLANT_PRESET_IMAGES = [
  { name: 'Monstera', url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&q=80&w=600' },
  { name: 'Fiddle Leaf', url: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=600' },
  { name: 'Snake Plant', url: 'https://images.unsplash.com/photo-1599598425947-020645161044?auto=format&fit=crop&q=80&w=600' },
  { name: 'Peacock Plant', url: 'https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&q=80&w=600' },
  { name: 'Golden Pothos', url: 'https://images.unsplash.com/photo-1596724817763-9216d4590d59?auto=format&fit=crop&q=80&w=600' },
  { name: 'Peace Lily', url: 'https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&q=80&w=600' }
];

export const AddPlantModal = ({ onClose }) => {
  const { addPlant } = usePlants();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [category, setCategory] = useState('Indoor');
  const [location, setLocation] = useState('Living Room');
  const [moistureMin, setMoistureMin] = useState(30);
  const [image, setImage] = useState(PLANT_PRESET_IMAGES[0].url);
  const [autoWater, setAutoWater] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !species) return;

    setIsSubmitting(true);
    await addPlant({
      name,
      species,
      category,
      location,
      moistureMin: Number(moistureMin),
      image,
      autoWater,
      notes
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-elevated border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
            <Sprout className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-xl text-slate-900">Add New Plant</h3>
            <p className="text-xs text-slate-500">Register a plant into the smart telemetry network</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Plant Name *
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Living Room Monstera"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Botanic Species *
            </label>
            <input 
              type="text"
              required
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="e.g. Monstera Deliciosa"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Garden Zone
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="Indoor">Indoor</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Balcony">Balcony</option>
                <option value="Greenhouse">Greenhouse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location Details
              </label>
              <input 
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Window Shelf"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Preset Photo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PLANT_PRESET_IMAGES.map((preset, idx) => (
                <div 
                  key={idx}
                  onClick={() => setImage(preset.url)}
                  className={`cursor-pointer relative rounded-xl overflow-hidden border-2 h-16 transition-all ${
                    image === preset.url ? 'border-emerald-600 ring-2 ring-emerald-400/50' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5 truncate px-1 font-medium">
                    {preset.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Min Soil Moisture Trigger ({moistureMin}%)
            </label>
            <input 
              type="range"
              min="15"
              max="55"
              value={moistureMin}
              onChange={(e) => setMoistureMin(e.target.value)}
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input 
              type="checkbox"
              id="addAutoWater"
              checked={autoWater}
              onChange={(e) => setAutoWater(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
            <label htmlFor="addAutoWater" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Enable Auto-Irrigation Pump for this plant
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add to Garden'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
