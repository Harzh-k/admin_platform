import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, RefreshCw, Shield, Database, Trash2, Edit3 } from 'lucide-react';
import AddModelModal from './AddModelModal';
import EditModelModal from './EditModelModal'; 

const ModelCatalogTable = () => {
    const [models, setModels] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedModelForEdit, setSelectedModelForEdit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState(83.50);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modelRes, settingsRes] = await Promise.all([
                axios.get('http://localhost:8000/admin/model-catalog'),
                axios.get('http://localhost:8000/admin/system/settings')
            ]);
            setModels(modelRes.data);
            setExchangeRate(settingsRes.data.usd_to_inr || 83.50);
        } catch (error) {
            console.error("Fetch failed:", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDelete = async (modelId) => {
        const confirmMsg = `⚠️ PERMANENT DELETE: Are you sure you want to remove "${modelId}"? \n\nAny teams assigned to this model will stop working immediately.`;
        if (window.confirm(confirmMsg)) {
            try {
                await axios.delete(`http://localhost:8000/admin/catalog/${modelId}`);
                fetchData();
            } catch (err) {
                const msg = err.response?.data?.detail || "Delete failed";
                alert(`Error: ${msg}`);
            }
        }
    };

    const handleToggleStatus = async (model) => {
        try {
            await axios.put(`http://localhost:8000/admin/catalog/${model.model_id}`, {
                is_active: !model.is_active
            });
            fetchData();
        } catch (err) {
            console.error("Status toggle failed:", err.message);
            alert("Could not update status. Check backend connection.");
        }
    };

    const maskKey = (key) => {
        if (!key) return "No Key";
        return `${key.substring(0, 6)}••••${key.slice(-4)}`;
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {/* HEADER */}
            <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" /> Model Governance
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Manual Configuration | 1 USD = ₹{exchangeRate.toFixed(2)}
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                        <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        <Plus className="w-4 h-4" /> Add New Model
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                            <th className="p-6">Model ID & Provider</th>
                            <th className="p-6">API Key</th>
                            <th className="p-6 text-right">Input / 1M</th>
                            <th className="p-6 text-right">Output / 1M</th>
                            <th className="p-6 text-center">Status</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {models.map((model) => (
                            <tr key={model.model_id} className="hover:bg-slate-50/50 transition-all group">
                                <td className="p-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-slate-800">{model.model_id}</span>
                                        <span className="text-[9px] font-bold text-blue-500 uppercase">{model.provider}</span>
                                    </div>
                                </td>
                                <td className="p-6 font-mono text-[10px] text-slate-400">
                                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg w-fit">
                                        <Shield className="w-3 h-3" /> {maskKey(model.api_key)}
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-black text-slate-700">${(model.input_price_per_1m || 0).toFixed(4)}</span>
                                        <span className="text-[9px] font-bold text-emerald-600">₹{((model.input_price_per_1m || 0) * exchangeRate).toFixed(2)}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-black text-slate-700">${(model.output_price_per_1m || 0).toFixed(4)}</span>
                                        <span className="text-[9px] font-bold text-emerald-600">₹{((model.output_price_per_1m || 0) * exchangeRate).toFixed(2)}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-center">
                                    <button 
                                        onClick={() => handleToggleStatus(model)}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${
                                            model.is_active 
                                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                    >
                                        {model.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                             <button 
                                                onClick={() => setSelectedModelForEdit(model)}
                                                className="p-2 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100 hover:border-blue-200 shadow-sm"
                                                title="Edit Model">
                                              <Edit3 className="w-4 h-4" />
                                              </button>

                                            <button 
                                                 onClick={() => handleDelete(model.model_id)}
                                                 className="p-2 bg-slate-50 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100 hover:border-red-200 shadow-sm"
                                                 title="Remove Model">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddModelModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onModelAdded={fetchData} 
            />

            <EditModelModal 
                key={selectedModelForEdit?.model_id}
                isOpen={!!selectedModelForEdit} 
                onClose={() => setSelectedModelForEdit(null)} 
                model={selectedModelForEdit} 
                onModelUpdated={fetchData} 
            />
        </div>
    );
};

export default ModelCatalogTable;