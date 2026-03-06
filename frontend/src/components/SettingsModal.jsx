import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { Lock, X, Server, Key, Edit2, ShieldCheck, Trash2 } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState('');
  const [key, setKey] = useState('');
  const [configList, setConfigList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isOpen) fetchConfigList();
  }, [isOpen]);

  const fetchConfigList = async () => {
    try {
      const res = await adminService.getSystemStatus();
      setConfigList(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch configs:", error);
    }
  };

  const handleSave = async () => {
    const cleanProvider = provider.toLowerCase().trim();
    const cleanKey = key.trim();

    if (!cleanKey || !cleanProvider) {
      setMsg({ type: 'error', text: 'Both Provider ID and Key are required.' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      await adminService.configureSystem({
        provider: cleanProvider,
        key: cleanKey
      });

      setMsg({ type: 'success', text: `Saved ${cleanProvider.toUpperCase()} successfully!` });
      setKey('');
      setProvider('');
      fetchConfigList(); 
    } catch (error) {
      console.error("Save configuration failed:", error);
      setMsg({ type: 'error', text: 'Failed to save configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (provName) => {
    setProvider(provName);
    setKey(''); 
    setMsg({ type: 'info', text: `Updating key for ${provName.toUpperCase()}` });
  };

  const handleDelete = async (provName) => {
    if (!window.confirm(`Permanently delete ${provName.toUpperCase()} configuration?`)) {
      return;
    }

    try {
      await adminService.deleteConfig(provName.toLowerCase().trim());
      setMsg({ type: 'success', text: 'Deleted successfully.' });
      fetchConfigList(); 
    } catch (error) {
      console.error("Delete failed:", error);
      setMsg({ type: 'error', text: 'Delete failed. Check backend logs.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Lock className="w-5 h-5 text-blue-600" /> System Configuration
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* ACTIVE PROVIDERS LIST */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Active Providers</h3>
          
          {configList.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
              No configurations found.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {configList.map((cfg, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-bold text-slate-800 uppercase text-sm">{cfg.provider}</p>
                      <p className="text-[10px] text-slate-500">Last Updated: {cfg.last_updated}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(cfg.provider)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-all text-slate-500 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cfg.provider)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-all text-slate-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 my-6"></div>

        {/* 2. FORM SECTION */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Manage Key</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Server className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="ID (e.g. openai)"
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700"
              />
            </div>

            <div className="relative">
              <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="API Key"
                className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
              />
            </div>
          </div>

          {msg && (
            <div className={`text-xs p-3 rounded-lg text-center font-bold ${
              msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
              msg.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
              'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {msg.text}
            </div>
          )}

          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;