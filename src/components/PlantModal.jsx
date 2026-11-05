import React, { useState } from 'react';
import { X, Droplets, Thermometer, Sun, Wind, Activity, Save, Sliders, Calendar, Sparkles, CheckCircle } from 'lucide-react';
import { usePlants } from '../context/PlantContext';
import { TelemetryChart } from './TelemetryChart';

export const PlantModal = ({ plant, onClose }) => {
  const { updatePlant, waterPlant } = usePlants();
  const [moistureMin, setMoistureMin] = useState(plant.moistureMin || 30);
  const [autoWater, setAutoWater] = useState(plant.autoWater ?? true);
  const [location, setLocation] = useState(plant.location || '');
  const [notes, setNotes] = useState(plant.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await updatePlant(plant.id, {
      moistureMin: Number(moistureMin),
      autoWater,
      location,
      notes
    });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleWaterNow = () => {
    waterPlant(plant.id, 40);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-elevated border border-slate-200 flex flex-col">
        
        {/* Header Banner */}
        <div className="relative h-48 w-full bg-slate-900">
          <img 
            src={plant.image} 
            alt={plant.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/40 to-transparent"></div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white font-semibold text-xs mb-1 inline-block">
                {plant.category} Zone
              </span>
              <h2 className="text-2xl font-black text-white">{plant.name}</h2>
              <p className="text-emerald-300 text-xs italic font-medium">{plant.species}</p>
            </div>

            <button
              onClick={handleWaterNow}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-glow transition-all active:scale-95"
            >
              <Droplets className="w-4 h-4 fill-white" />
              <span>Dose Water</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50/80 border border-blue-200/60 p-3 rounded-2xl text-center">
              <div className="text-xs text-blue-700 font-semibold flex items-center justify-center gap-1">
                <Droplets className="w-3.5 h-3.5" /> Moisture
              </div>
              <div className="text-lg font-black text-blue-950 font-mono mt-1">{plant.moisture}%</div>
            </div>

            <div className="bg-orange-50/80 border border-orange-200/60 p-3 rounded-2xl text-center">
              <div className="text-xs text-orange-700 font-semibold flex items-center justify-center gap-1">
                <Thermometer className="w-3.5 h-3.5" /> Ambient
              </div>
              <div className="text-lg font-black text-orange-950 font-mono mt-1">{plant.temp}°C</div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/60 p-3 rounded-2xl text-center">
              <div className="text-xs text-amber-700 font-semibold flex items-center justify-center gap-1">
                <Sun className="w-3.5 h-3.5" /> Sun Light
              </div>
              <div className="text-lg font-black text-amber-950 font-mono mt-1">{plant.light} lux</div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/60 p-3 rounded-2xl text-center">
              <div className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1">
                <Wind className="w-3.5 h-3.5" /> Humidity
              </div>
              <div className="text-lg font-black text-emerald-950 font-mono mt-1">{plant.humidity}%</div>
            </div>
          </div>

          {/* Telemetry Chart */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              Live Telemetry & Moisture History
            </h4>
            <TelemetryChart plantName={plant.name} currentMoisture={plant.moisture} />
          </div>

          {/* Calibration & Rules Form */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Smart Irrigation Calibration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Minimum Moisture Safety Threshold ({moistureMin}%)
                </label>
                <input 
                  type="range" 
                  min="15" 
                  max="60"
                  value={moistureMin}
                  onChange={(e) => setMoistureMin(e.target.value)}
                  className="w-full accent-emerald-600 bg-slate-200 h-2 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">
                  Pump auto-activates when moisture drops below this value.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Plant Location / Zone
                </label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. South Window, Balcony Rack"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="autoWater"
                  checked={autoWater}
                  onChange={(e) => setAutoWater(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="autoWater" className="text-xs font-semibold text-emerald-950 cursor-pointer">
                  Enable Automated Smart Pump Dosing for this plant
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Care Notes & Observations
              </label>
              <textarea 
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                placeholder="Custom soil recipe, sunlight preferences, pruning schedule..."
              ></textarea>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Calibration Saved!
                </span>
              ) : <div></div>}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
