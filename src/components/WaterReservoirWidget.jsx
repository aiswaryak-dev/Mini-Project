import React from 'react';
import { Droplets, RefreshCw, Zap, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

export const WaterReservoirWidget = () => {
  const { 
    reservoirLevel, 
    isPumpActive, 
    autoIrrigationEnabled, 
    setAutoIrrigationEnabled,
    refillReservoir 
  } = usePlants();

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-5 shadow-elevated border border-emerald-800/60 relative overflow-hidden flex flex-col justify-between">
      
      {/* Background Animated Water Bubbles Effect */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isPumpActive ? 'bg-cyan-500 animate-pulse text-slate-950' : 'bg-emerald-800/60 text-emerald-300'}`}>
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Smart Irrigation Unit</h3>
            <span className="text-[11px] text-emerald-300/80 font-medium">IoT Hydro-Pump v1.4</span>
          </div>
        </div>

        <button
          onClick={() => setAutoIrrigationEnabled(!autoIrrigationEnabled)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            autoIrrigationEnabled
              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
          title="Toggle automated pump triggering based on moisture safety levels"
        >
          <Zap className={`w-3.5 h-3.5 ${autoIrrigationEnabled ? 'text-emerald-400 fill-emerald-400' : ''}`} />
          <span>Auto-Dose: {autoIrrigationEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Water Level Gauge */}
      <div className="my-4 z-10 space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[11px] text-emerald-200 uppercase tracking-wider font-semibold">Reservoir Capacity</span>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
              {reservoirLevel}%
              <span className="text-xs text-emerald-300 font-normal">({(reservoirLevel * 0.05).toFixed(1)} L / 5.0 L)</span>
            </div>
          </div>

          {reservoirLevel < 25 && (
            <span className="px-2 py-1 rounded-lg bg-red-500/30 border border-red-500/50 text-red-200 text-[10px] font-bold animate-bounce">
              REFILL NEEDED
            </span>
          )}
        </div>

        <div className="relative w-full bg-emerald-950/90 h-4 rounded-full overflow-hidden p-0.5 border border-emerald-700/60 shadow-inner">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-300 transition-all duration-700"
            style={{ width: `${reservoirLevel}%` }}
          ></div>
        </div>
      </div>

      {/* Pump Status & Refill */}
      <div className="pt-3 border-t border-emerald-800/60 flex items-center justify-between z-10 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-300">
          <span className={`w-2 h-2 rounded-full ${isPumpActive ? 'bg-cyan-400 animate-ping' : 'bg-emerald-500'}`}></span>
          <span className="font-semibold text-white">
            Pump Status: {isPumpActive ? 'DOSING WATER...' : 'Standby'}
          </span>
        </div>

        <button
          onClick={refillReservoir}
          disabled={reservoirLevel >= 100}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold transition-all border border-emerald-600/40 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refill Tank</span>
        </button>
      </div>

    </div>
  );
};
