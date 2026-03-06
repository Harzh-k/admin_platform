import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import Leaderboard from '../components/Leaderboard';
import UsageTable from '../components/UsageTable';
import { ShieldCheck, Copy, LogOut, Mail, Lock, KeyRound, RefreshCw } from 'lucide-react';

const LeadDashboard = () => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1); // NEW: Pagination State
  const [showPassForm, setShowPassForm] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [uiRefreshing, setUiRefreshing] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isFetching = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetching.current || !user?.email) return;
    isFetching.current = true;
    setUiRefreshing(true);
    
    try {
      // Pass the page parameter to the lead stats endpoint
      const res = await axios.get(`http://localhost:8000/lead/dashboard-stats?email=${user.email}&page=${page}`);
      setData(res.data);
    } catch (err) {
      console.error("❌ Lead Sync Failed:", err);
    } finally {
      isFetching.current = false;
      setTimeout(() => setUiRefreshing(false), 1000);
    }
  }, [user?.email, page]); // Dependency on page to re-fetch when page changes

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("Passwords do not match!");
    try {
      await axios.post('http://localhost:8000/member/change-password', {
        email: user.email,
        old_password: passData.old,
        new_password: passData.new
      });
      alert("Security Updated. Please re-login.");
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.detail || "Update failed");
    }
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">Syncing Team Context...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8 font-sans">
      {/* HEADER */}
      <header className="flex justify-between items-center bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-emerald-100">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase leading-none">
              {data.team_name} <span className="text-blue-600">_Lead</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Unit Controller</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            {uiRefreshing && <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />}
            <button 
                onClick={() => setShowPassForm(!showPassForm)}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all flex items-center gap-1.5"
            >
                <Lock className="w-3 h-3" /> Security
            </button>
            <button onClick={() => {localStorage.clear(); window.location.href='/login';}} className="p-2 text-slate-400 hover:text-red-600 transition-all">
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </header>

      {/* SECURITY FORM */}
      {showPassForm && (
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden animate-in slide-in-from-top-4 duration-300 mb-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-2 rounded-lg border border-white/30 backdrop-blur-md">
                    <KeyRound className="text-white w-5 h-5" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-tight">Update Lead Credentials</h2>
            </div>
            <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <input type="password" placeholder="Current" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none" onChange={(e) => setPassData({...passData, old: e.target.value})} />
                <input type="password" placeholder="New Password" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none" onChange={(e) => setPassData({...passData, new: e.target.value})} />
                <div className="flex gap-2">
                    <input type="password" placeholder="Confirm" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none flex-1" onChange={(e) => setPassData({...passData, confirm: e.target.value})} />
                    <button type="submit" className="bg-white text-blue-600 px-6 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-50">Save</button>
                </div>
            </form>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Team Monthly Spend" value={`$${data.spent.toFixed(4)}`} />
        <StatCard title="Total Team Tokens" value={data.total_team_tokens.toLocaleString()} />
        <StatCard title="My Personal Tokens" value={data.personal_tokens.toLocaleString()} />
        <StatCard title="Budget Health" value={`$${(data.budget - data.spent).toFixed(2)} Left`} />
      </div>

      {/* CREDENTIALS TOOLKIT */}
      <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck className="w-32 h-32 text-white" /></div>
        <div className="relative z-10">
            <div className="mb-8">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/30">
                    Lead Identity & Auth
                </span>
                <h2 className="text-2xl font-black mt-2">Team Access Credentials</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-blue-100 uppercase tracking-widest"><Mail className="w-3 h-3" /> Lead Email</label>
                    <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                        <code className="text-white font-mono text-sm">{data.lead_email}</code>
                        <button onClick={() => {navigator.clipboard.writeText(data.lead_email); alert("Email Copied");}} className="text-white/60 hover:text-white"><Copy className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-blue-100 uppercase tracking-widest"><ShieldCheck className="w-3 h-3" /> Ingestion Key</label>
                    <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                        <code className="text-white font-mono text-sm">{data.ingestion_key}</code>
                        <button onClick={() => {navigator.clipboard.writeText(data.ingestion_key); alert("Key Copied");}} className="text-white/60 hover:text-white"><Copy className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1"><Leaderboard title="Team Rankings" data={data.leaderboard} /></div>
        <div className="lg:col-span-2">
            <UsageTable 
              title="Unit Audit Trail" 
              data={data.history.items} 
              total={data.history.total}
              currentPage={page}
              totalPages={data.history.total_pages}
              onPageChange={(p) => setPage(p)}
            />
        </div>
      </div>
    </div>
  );
};

export default LeadDashboard;