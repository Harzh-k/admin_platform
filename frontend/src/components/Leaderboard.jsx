import React from 'react';
import { Trophy, User } from 'lucide-react';

const Leaderboard = ({ data }) => {
  // Safe check for max spend to avoid division by zero
  const maxSpend = data && data.length > 0 ? data[0].spend : 1;

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
          <Trophy className="text-amber-500 w-5 h-5" /> Top Spenders
        </h3>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          Monthly
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
        {data && data.map((item, index) => (
          <div key={index} className="relative group">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shadow-sm transition-all group-hover:scale-110 ${
                  index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-100'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 leading-none mb-1">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    {((item.tokens || 0) / 1000).toFixed(1)}k tokens consumed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-blue-600">${(item.spend || 0).toFixed(3)}</p>
              </div>
            </div>
            
            {/* Visual Spend Bar */}
            <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden border border-slate-100">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  index === 0 ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                style={{ width: `${((item.spend || 0) / maxSpend) * 100}%` }}
              />
            </div>
          </div>
        ))}

        {(!data || data.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-slate-300">
            <User className="w-8 h-8 mb-2 opacity-20" />
            <p className="italic text-xs font-bold uppercase tracking-widest">No Active Sessions</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { 
          width: 5px; 
        }
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: #F8FAFC; /* Very light slate track */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #DBEAFE; /* Light blue (blue-100) base */
          border-radius: 10px; 
          border: 1px solid #BFDBFE; /* blue-200 border */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
          background: #0052CC; /* Bajaj Corporate Blue on hover */
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;