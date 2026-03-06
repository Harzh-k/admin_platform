import React, { useState } from 'react';
import { adminService } from '../services/api';
import { Users, X, DollarSign, Server, Cpu } from 'lucide-react';

const CreateTeamModal = ({ isOpen, onClose, onTeamCreated }) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [budget, setBudget] = useState(100);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.createTeam({ 
        name, 
        budget: parseFloat(budget),
        provider: provider.toLowerCase().trim() 
      });
      
      onTeamCreated(); 
      setName('');
      setBudget(100);
      setProvider('gemini');
      onClose();
    } catch (err) {
      console.error("Failed to create team", err);
      alert("Error creating team: Check if enterprise ID exists");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Users className="w-7 h-7 text-blue-600" /> NEW TEAM
            </h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Provisioning Unit</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Team Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Identify Team</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Claims Processing AI"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Provider Selection*/}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Inference Provider</label>
            <div className="relative">
              <Cpu className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <select
                required
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 appearance-none cursor-pointer"
              >
                <option value="gemini">Google Gemini (1.5 Flash/Pro)</option>
                <option value="openai">OpenAI (GPT-4o / o1)</option>
                <option value="anthropic">Anthropic (Claude 3.5)</option>
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Monthly Ceiling (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'AUTHORIZE & GENERATE KEY'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;