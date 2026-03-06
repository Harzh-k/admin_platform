import React from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';

const UsageTable = ({ data = [], total = 0, currentPage = 1, onPageChange, totalPages = 1 }) => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">Live Audit Trail</h3>
          </div>
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-widest">
            Total Logs: {total}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border-b border-slate-50">
                <th className="px-8 py-4">Team</th>
                <th className="px-8 py-4">Model</th>
                <th className="px-8 py-4 text-right">Tokens</th>
                <th className="px-8 py-4 text-right">Cost (USD)</th>
                <th className="px-8 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data && data.length > 0 ? (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-4 font-bold text-slate-700">{row.team}</td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white rounded-md text-[10px] font-black uppercase transition-all">
                        {row.model}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right text-slate-500 font-mono text-xs">{row.tokens?.toLocaleString()}</td>
                    <td className="px-8 py-4 text-right font-black text-slate-900">{row.cost}</td>
                    <td className="px-8 py-4 text-right text-slate-400 text-xs font-medium">{row.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs italic">
                    No records found in this page
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER CONTROLS */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing Page <span className="text-blue-600 font-black">{currentPage}</span> of {totalPages}
        </p>
        
        <div className="flex gap-2">
          <button 
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageTable;