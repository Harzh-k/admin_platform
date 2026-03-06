import React, { useState } from 'react';
import axios from 'axios';
import { X, ShieldCheck, Zap, DollarSign } from 'lucide-react';

const AddModelModal = ({ isOpen, onClose, onModelAdded }) => {
    const [formData, setFormData] = useState({
        model_id: '',
        friendly_name: '',
        provider: 'Google',
        api_key: '',
        input_price_per_1m: 0.0,
        output_price_per_1m: 0.0
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/admin/model-catalog/add', formData);
            alert("✅ Model Registered Successfully");
            onModelAdded();
            onClose();
        } catch (error) {
            alert("Error adding model: " + (error.response?.data?.detail || "Check connection"));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Register New Model</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manual Resource Configuration</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Official Model ID</label>
                            <input required placeholder="e.g. gemini-1.5-flash" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold focus:border-blue-500 outline-none" 
                                   onChange={e => setFormData({...formData, model_id: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Provider</label>
                            <select className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none"
                                    onChange={e => setFormData({...formData, provider: e.target.value})}>
                                <option value="Google">Google (Gemini)</option>
                                <option value="OpenAI">OpenAI</option>
                                <option value="Anthropic">Anthropic</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-500" /> Dedicated API Key
                        </label>
                        <input required type="password" placeholder="Paste sk-... or google-key" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-mono outline-none"
                               onChange={e => setFormData({...formData, api_key: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-emerald-500" /> Input / 1M (USD)
                            </label>
                            <input required type="number" step="0.000001" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none"
                                   onChange={e => setFormData({...formData, input_price_per_1m: parseFloat(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3 text-emerald-500" /> Output / 1M (USD)
                            </label>
                            <input required type="number" step="0.000001" className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none"
                                   onChange={e => setFormData({...formData, output_price_per_1m: parseFloat(e.target.value)})} />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" /> Finalize Registration
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddModelModal;