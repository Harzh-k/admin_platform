import React, { useState } from 'react';
import axios from 'axios';
import { X, Save, DollarSign, Key, Cpu } from 'lucide-react';

const EditModelModal = ({ isOpen, onClose, model, onModelUpdated }) => {

  const [formData, setFormData] = useState({
    friendly_name: model?.friendly_name || '',
    api_key: model?.api_key || '',
    input_price_per_1m: model?.input_price_per_1m || 0,
    output_price_per_1m: model?.output_price_per_1m || 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8000/admin/catalog/${model.model_id}`, formData);
      onModelUpdated();
      onClose();
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.detail || err.message));
    }
  };

  if (!isOpen || !model) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase leading-none">Edit Intelligence</h2>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-2">{model.model_id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Friendly Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Friendly Name</label>
            <div className="relative">
              <Cpu className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                value={formData.friendly_name}
                onChange={(e) => setFormData({...formData, friendly_name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 pl-11 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Update API Key</label>
            <div className="relative">
              <Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="password"
                placeholder="Leave blank to keep current"
                value={formData.api_key}
                onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 pl-11 p-3 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Input / 1M ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-3 h-3 text-emerald-500" />
                <input 
                  type="number" step="0.000001"
                  value={formData.input_price_per_1m}
                  onChange={(e) => setFormData({...formData, input_price_per_1m: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 pl-8 p-3 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Output / 1M ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-3 h-3 text-emerald-500" />
                <input 
                  type="number" step="0.000001"
                  value={formData.output_price_per_1m}
                  onChange={(e) => setFormData({...formData, output_price_per_1m: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 pl-8 p-3 rounded-xl text-xs font-bold outline-none"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2">
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditModelModal;