import React, { useState } from 'react';
import { Sliders, Zap, Droplets, Thermometer, ShieldCheck, RefreshCw, Save, CheckCircle2 } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

export const Automation = () => {
  const { 
    plants, 
    autoIrrigationEnabled, 
    setAutoIrrigationEnabled, 
    simulationActive, 
    setSimulationActive,
    updatePlant,
    refillReservoir,
    reservoirLevel
  } = usePlants();

  const [doseVolume, setDoseVolume] = useState('200ml');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleUpdateMin = (plantId, val) => {
    updatePlant(plantId, { moistureMin: Number(val) });
  };

  const handleSaveGlobal = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <Sliders className="w-3.5 h-3.5" /> Automated Irrigation & Rules Engine
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Smart Hydro-Pump & Sensor Rules</h2>
        <p className="text-xs text-slate-500">Configure automated trigger conditions, pump dosing volumes, and IoT telemetry pulse</p>
      </div>

      {/* Main Grid: Master Switches & Rules Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Master Engine Controls */}
        <div className="space-y-5">
          
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Automated Irrigation Master Control
            </h3>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">Auto-Dosing Engine</span>
                <button
                  onClick={() => setAutoIrrigationEnabled(!autoIrrigationEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoIrrigationEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoIrrigationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <p className="text-[11px] text-emerald-800 leading-relaxed">
                When enabled, the hydro-pump automatically doses water whenever a plant's soil moisture drops below its configured safety threshold.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">IoT Telemetry Pulse</span>
                <button
                  onClick={() => setSimulationActive(!simulationActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    simulationActive ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    simulationActive ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Simulates real-world soil moisture transpiration and ambient light/temperature fluctuations every 4 seconds.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Default Dosing Volume Per Cycle
              </label>
              <select
                value={doseVolume}
                onChange={(e) => setDoseVolume(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                <option value="100ml">100 ml (Low Dosing - Small Pots)</option>
                <option value="200ml">200 ml (Standard Dosing)</option>
                <option value="350ml">350 ml (High Capacity - Trees)</option>
              </select>
            </div>

            <button
              onClick={handleSaveGlobal}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save System Parameters</span>
            </button>

            {savedSuccess && (
              <div className="text-xs text-center font-bold text-emerald-600 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Parameters Applied & Saved!
              </div>
            )}

          </div>

        </div>

        {/* Right 2 Cols: Plant Moisture Calibration Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Plant Sensor Threshold Calibrations</h3>
              <p className="text-xs text-slate-500">Fine-tune minimum soil moisture triggers for individual plants</p>
            </div>

            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {plants.length} Active Nodes
            </span>
          </div>

          <div className="space-y-3">
            {plants.map((plant) => (
              <div key={plant.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-center gap-3">
                  <img src={plant.image} alt={plant.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{plant.name}</h4>
                    <span className="text-[11px] text-slate-500">{plant.species} • {plant.location}</span>
                  </div>
                </div>

                <div className="flex-1 max-w-xs space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Trigger Below:</span>
                    <span className="font-bold text-emerald-700 font-mono">{plant.moistureMin}% Moisture</span>
                  </div>
                  <input 
                    type="range"
                    min="15"
                    max="60"
                    value={plant.moistureMin}
                    onChange={(e) => handleUpdateMin(plant.id, e.target.value)}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    plant.autoWater ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {plant.autoWater ? 'Auto-Dose' : 'Manual Only'}
                  </span>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
