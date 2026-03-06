import React, { useState } from 'react';
import { Users, Zap, Shield, Settings2, Cpu, RefreshCw, Key } from 'lucide-react';
import { adminService } from '../services/api';

const TeamGrid = ({ teams, onManageMembers, onEditTeam, onTeamUpdated, layout = 'grid' }) => {
  const [rotatingId, setRotatingId] = useState(null);

  // --- KEY ROTATION HANDLER ---
  const handleRotateKey = async (team) => {
    const confirmMessage = `⚠️ CRITICAL ACTION: Rotating the key for "${team.name}" will immediately invalidate the current key. All active AI integrations using this key will stop working. \n\nAre you sure?`;
    
    if (window.confirm(confirmMessage)) {
      setRotatingId(team.id);
      try {
        const res = await adminService.rotateKey(team.id);
        alert(`Success! New Ingestion Key generated: \n\n${res.data.new_key}`);
        if (onTeamUpdated) onTeamUpdated(); // Refresh dashboard data
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to rotate key.");
      } finally {
        setRotatingId(null);
      }
    }
  };

  const containerClasses = layout === 'horizontal' 
    ? "flex flex-nowrap gap-6 w-max" 
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

  const cardClasses = layout === 'horizontal' 
    ? "w-[350px] shrink-0 snap-center" 
    : "";

  return (
    <div className={containerClasses}>
      {teams.map((team) => (
        <div key={team.id} className={`${cardClasses} bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden`}>
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-2">
              <div className={`p-2 rounded-xl ${
                team.status === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                <Shield className="w-6 h-6" />
              </div>
              
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 rounded-xl border border-slate-100 self-center">
                <Cpu className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-tighter">
                  {team.provider || 'openai'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => onEditTeam(team)}
              className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              title="Edit Team Settings"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-1">{team.name}</h3>
          
          {/* KEY SECTION WITH ROTATE BUTTON */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-slate-50 border border-slate-100 p-1.5 rounded-xl flex items-center justify-between overflow-hidden">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Key className="w-3 h-3 text-slate-400 shrink-0" />
                    <code className="text-[10px] text-slate-500 font-mono truncate">
                        {team.key}
                    </code>
                </div>
                <button 
                    onClick={() => handleRotateKey(team)}
                    disabled={rotatingId === team.id}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm active:scale-90"
                    title="Rotate Ingestion Key"
                >
                    <RefreshCw className={`w-3 h-3 ${rotatingId === team.id ? 'animate-spin text-blue-600' : ''}`} />
                </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Budget Usage</span>
              <span className={team.usage_percent > 90 ? 'text-red-600' : 'text-slate-900'}>
                {team.usage_percent || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  team.usage_percent > 90 ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(team.usage_percent || 0, 100)}%` }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <div className="text-xs">
              <p className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">Total Spent</p>
              <p className="font-bold text-slate-900">
                ${(team.spent || 0).toFixed(4)}
              </p>
            </div>
            
            <button 
              onClick={() => onManageMembers(team)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-blue-100"
            >
              <Users className="w-4 h-4" />
              Members
            </button>
          </div>
        </div>
      ))}

      {teams.length === 0 && (
        <div className="col-span-full py-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Zap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No teams found</p>
        </div>
      )}
    </div>
  );
};

export default TeamGrid;