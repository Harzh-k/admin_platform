import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { adminService } from '../services/api';
import { Settings2, X, DollarSign, Cpu, Save, BrainCircuit } from 'lucide-react';

const EditTeamModal = ({ isOpen, onClose, team, onTeamUpdated }) => {
  // 1. Core State
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [budget, setBudget] = useState(0);
  const [assignedModel, setAssignedModel] = useState(''); // New State for Model
  const [availableModels, setAvailableModels] = useState([]); // List from DB
  const [loading, setLoading] = useState(false);

  // 2. Sync state and Fetch Catalog
  useEffect(() => {
    if (team && isOpen) {
      setName(team.name || '');
      setProvider(team.provider || 'gemini');
      setBudget(team.token_budget_usd || 0);
      setAssignedModel(team.assigned_model || '');
      
      // Fetch the "Genuine" models added by Admin
      const fetchCatalog = async () => {
        try {
          const res = await axios.get('http://localhost:8000/admin/active-models/list');
          setAvailableModels(res.data);
        } catch (err) {
          console.error("❌ Failed to fetch model catalog:", err);
        }
      };
      fetchCatalog();
    }
  }, [team, isOpen]);

  if (!isOpen || !team) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: name,
        provider: provider.toLowerCase().trim(),
        budget: parseFloat(budget),
        assigned_model: assignedModel 
      };

      await adminService.updateTeam(team.id, payload);
      
      onTeamUpdated(); 
      onClose();
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("Failed to update team settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-blue-50">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Settings2 className="w-7 h-7 text-blue-600" /> CONFIGURE
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
              Unit ID: {team.id}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-300 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Team Label */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Team Label</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
            />
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Cloud Provider</label>
            <div className="relative">
              <Cpu className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 appearance-none"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC MODEL SELECTION */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Assigned AI Model</label>
            <div className="relative">
              <BrainCircuit className="absolute left-4 top-4 w-5 h-5 text-blue-500" />
              <select
                required
                value={assignedModel}
                onChange={(e) => setAssignedModel(e.target.value)}
                className="w-full pl-12 p-4 bg-slate-50 border border-blue-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 appearance-none border-l-4 border-l-blue-500"
              >
                <option value="">Select from Catalog...</option>
                {availableModels.map((modelId) => (
                  <option key={modelId} value={modelId}>{modelId}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Token Budget (USD)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <input 
                type="number" 
                step="0.01"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                APPLY CONFIGURATION
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;