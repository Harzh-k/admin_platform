import React from 'react';
import { Shield, Key, TrendingUp } from 'lucide-react';

const TeamList = ({ teams }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {teams.map((team) => (
        <div key={team.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{team.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Key className="w-3 h-3 text-slate-400" />
                <code className="text-xs bg-slate-50 px-2 py-1 rounded text-slate-600 font-mono">
                  {team.ingestion_key}
                </code>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${team.usage_percent > 90 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
              {team.usage_percent}% Used
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
                <span>Monthly Budget</span>
                <span>${team.current_spend_usd.toFixed(2)} / ${team.token_budget_usd}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${team.usage_percent > 90 ? 'bg-red-500' : 'bg-brand-blue'}`}
                  style={{ width: `${Math.min(team.usage_percent, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <Shield className="w-4 h-4 text-emerald-500" />
                Redaction Active
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Optimized
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamList;