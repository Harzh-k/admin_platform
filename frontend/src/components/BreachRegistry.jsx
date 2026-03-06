import React from 'react';
import { ShieldAlert, Clock, AlertTriangle } from 'lucide-react';

const BreachRegistry = ({ violations = [] }) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-red-100 shadow-sm overflow-hidden h-[400px] flex flex-col">
      <div className="px-8 py-5 border-b border-red-50 bg-red-50/30 flex justify-between items-center shrink-0">
        <h3 className="font-black text-red-800 flex items-center gap-2 uppercase text-sm tracking-tight">
          <ShieldAlert className="w-4 h-4" /> Policy Breaches
        </h3>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Audit</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {violations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-emerald-50 p-4 rounded-full mb-4">
                <ShieldAlert className="w-8 h-8 text-emerald-500 opacity-40" />
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">System Secured: No Breaches</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {violations.map((v) => (
              <div key={v.id} className="p-5 px-8 hover:bg-red-50/30 transition-all flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-2 rounded-lg group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{v.team_name}</p>
                    <p className="text-[9px] text-red-600 font-black uppercase tracking-widest">{v.violation_type} DETECTED</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <Clock className="w-3 h-3" /> {v.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #FEE2E2; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FECACA; }
      `}</style>
    </div>
  );
};

export default BreachRegistry;