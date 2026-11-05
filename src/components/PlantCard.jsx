import React, { useState } from 'react';
import { Droplets, Thermometer, Sun, Zap, MoreVertical, AlertTriangle, CheckCircle2, HeartPulse, Trash2 } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

export const PlantCard = ({ plant, onSelectPlant }) => {
  const { waterPlant, deletePlant } = usePlants();
  const [watering, setWatering] = useState(false);

  const handleWater = (e) => {
    e.stopPropagation();
    setWatering(true);
    waterPlant(plant.id);
    setTimeout(() => setWatering(false), 1500);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove ${plant.name} from monitoring?`)) {
      deletePlant(plant.id);
    }
  };

  // Status color styles
  const getStatusBadge = () => {
    switch (plant.status) {
      case 'Optimal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Optimal
          </span>
        );
      case 'Needs Water':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300/60 animate-pulse">
            <Droplets className="w-3 h-3 text-amber-600" /> Needs Water
          </span>
        );
      case 'Alert':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 border border-red-300/60 animate-bounce">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Action Required
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300/60">
            <HeartPulse className="w-3 h-3 text-blue-600" /> {plant.status}
          </span>
        );
    }
  };

  return (
    <div 
      onClick={() => onSelectPlant(plant)}
      className="group cursor-pointer bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between"
    >
      {/* Plant Image & Overlays */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img 
          src={plant.image} 
          alt={plant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-medium border border-white/20">
            {plant.category || 'Garden'}
          </span>

          <div className="flex items-center gap-1">
            {plant.autoWater && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm">
                AUTO-IRRIGATE
              </span>
            )}
            <button 
              onClick={handleDelete}
              className="p-1.5 rounded-full bg-black/40 hover:bg-red-600/80 text-white/80 hover:text-white backdrop-blur-md transition-colors"
              title="Delete Plant"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Title overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-bold text-white text-lg drop-shadow-sm leading-tight">
            {plant.name}
          </h3>
          <p className="text-emerald-200 text-xs italic font-medium">
            {plant.species}
          </p>
        </div>
      </div>

      {/* Sensor Meter Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        
        {/* Moisture Sensor Bar */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              Soil Moisture
            </span>
            <span className={`font-bold font-mono ${
              plant.moisture < plant.moistureMin ? 'text-amber-600' : 'text-emerald-700'
            }`}>
              {plant.moisture}% <span className="text-[10px] text-slate-400 font-normal">(Min: {plant.moistureMin}%)</span>
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                plant.moisture < plant.moistureMin
                  ? 'bg-gradient-to-r from-amber-400 to-red-500'
                  : 'bg-gradient-to-r from-emerald-400 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, plant.moisture)}%` }}
            ></div>
          </div>
        </div>

        {/* Sensor Grid (Temp & Light) */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-100 text-orange-600">
              <Thermometer className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Temp</div>
              <div className="font-bold text-slate-700 font-mono">{plant.temp}°C</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Light</div>
              <div className="font-bold text-slate-700 font-mono">{plant.light} lux</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {getStatusBadge()}

          <button
            onClick={handleWater}
            disabled={watering}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
            title="Dose water to plant"
          >
            <Droplets className={`w-3.5 h-3.5 ${watering ? 'animate-bounce text-blue-600' : ''}`} />
            <span>{watering ? 'Watering...' : 'Water'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
