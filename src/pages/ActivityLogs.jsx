import React, { useState } from 'react';
import { History, Droplets, Sparkles, ShieldCheck, AlertTriangle, Filter, Search } from 'lucide-react';
import { usePlants } from '../context/PlantContext';

export const ActivityLogs = () => {
  const { activityLogs } = usePlants();
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = activityLogs.filter(log => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesSearch = 
      log.title.toLowerCase().includes(search.toLowerCase()) ||
      log.plantName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mb-2">
          <History className="w-3.5 h-3.5" /> Real-Time Event Audit Log
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Activity & Alert History</h2>
        <p className="text-xs text-slate-500">Live audit trail of irrigation events, AI diagnostics, and Firebase database updates</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event logs..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {['all', 'water', 'ai', 'firebase', 'alert'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                filterType === t
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

      </div>

      {/* Log Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 space-y-3">
        {filtered.length > 0 ? (
          filtered.map((log) => (
            <div key={log.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-4 hover:border-slate-200 transition-colors">
              
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                  log.type === 'water' ? 'bg-blue-100 text-blue-700' :
                  log.type === 'ai' ? 'bg-purple-100 text-purple-700' :
                  log.type === 'firebase' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {log.type === 'water' ? <Droplets className="w-5 h-5" /> :
                   log.type === 'ai' ? <Sparkles className="w-5 h-5" /> :
                   log.type === 'firebase' ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{log.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{log.details}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                      Target: {log.plantName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {log.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-slate-700">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {new Date(log.timestamp).toLocaleDateString()}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No activity log entries found matching filters.
          </div>
        )}
      </div>

    </div>
  );
};
