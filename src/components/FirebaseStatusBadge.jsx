import React from 'react';
import { Database, ShieldCheck, Wifi, Cloud } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

export const FirebaseStatusBadge = () => {
  const { firebaseStatus } = usePlants();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 shadow-sm backdrop-blur-sm transition-all hover:border-emerald-400/50">
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          firebaseStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
        }`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          firebaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
        }`}></span>
      </span>

      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
      
      <div className="flex items-center gap-1 font-medium">
        <span className="hidden sm:inline opacity-75">Firebase:</span>
        <span className="text-emerald-200 font-semibold">plant-care-system-d738d</span>
      </div>

      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300">
        {firebaseStatus === 'connected' ? 'Realtime DB' : 'Local Cache'}
      </span>
    </div>
  );
};
