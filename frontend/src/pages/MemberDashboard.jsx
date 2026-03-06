import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import UsageTable from '../components/UsageTable';
import { User, LogOut, Code, Copy, Cpu, ShieldCheck, Mail, Lock, KeyRound, RefreshCw } from 'lucide-react';

const MemberDashboard = () => {
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
      const res = await axios.get(`http://localhost:8000/member/stats?email=${user.email}&page=${page}`);
      setData(res.data);
    } catch (err) {
      console.error("❌ Member Sync Failed:", err);
    } finally {
      isFetching.current = false;
      setTimeout(() => setUiRefreshing(false), 1000);
    }
  }, [user?.email, page]); // Re-fetch on page change

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
      alert("Password Updated. Re-login required.");
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.detail || "Security update failed.");
    }
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Cpu className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Identity...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8 font-sans">
      <header className="flex justify-between items-center bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
            <User className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase leading-none">
              {data.full_name} <span className="text-blue-600">_User</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Verified Developer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            {uiRefreshing && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
            <button onClick={() => setShowPassForm(!showPassForm)} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 flex items-center gap-1.5 transition-all">
                <Lock className="w-3 h-3" /> Security
            </button>
            <button onClick={() => {localStorage.clear(); window.location.href='/login';}} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all">
                <LogOut className="w-5 h-5" />
            </button>
        </div>
      </header>

      {showPassForm && (
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden mb-8">
            <div className="flex items-center gap-3 mb-6">
                <KeyRound className="w-4 h-4" />
                <h2 className="text-sm font-black uppercase tracking-tight">Security Credentials Update</h2>
            </div>
            <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <input type="password" placeholder="Current" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none" onChange={(e) => setPassData({...passData, old: e.target.value})} />
                <input type="password" placeholder="New" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none" onChange={(e) => setPassData({...passData, new: e.target.value})} />
                <div className="flex gap-2">
                    <input type="password" placeholder="Confirm" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none flex-1" onChange={(e) => setPassData({...passData, confirm: e.target.value})} />
                    <button type="submit" className="bg-white text-blue-600 px-6 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-50">Update</button>
                </div>
            </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="My Personal Spend" value={`$${data.total_spent.toFixed(4)}`} />
        <StatCard title="Total Tokens Consumed" value={data.total_tokens.toLocaleString()} />
      </div>

      <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Code className="w-32 h-32 text-white" /></div>
        <div className="relative z-10">
            <div className="mb-8">
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/30">
                    Assigned Team: {data.team_name}
                </span>
                <h2 className="text-2xl font-black mt-2">Personal Developer Toolkit</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-blue-100 uppercase tracking-widest"><Mail className="w-3 h-3" /> Identity (X-User-Email)</label>
                    <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                        <code className="text-white font-mono text-sm">{data.email}</code>
                        <button onClick={() => {navigator.clipboard.writeText(data.email); alert("Email Copied");}} className="text-white/60 hover:text-white"><Copy className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-black text-blue-100 uppercase tracking-widest"><ShieldCheck className="w-3 h-3" /> Key (X-Ingestion-Key)</label>
                    <div className="flex items-center justify-between bg-white/10 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                        <code className="text-white font-mono text-sm">{data.ingestion_key}</code>
                        <button onClick={() => {navigator.clipboard.writeText(data.ingestion_key); alert("Key Copied");}} className="text-white/60 hover:text-white"><Copy className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-slate-900">Personal Audit Trail</h2>
        <UsageTable 
          data={data.history.items} 
          total={data.history.total}
          currentPage={page}
          totalPages={data.history.total_pages}
          onPageChange={(p) => setPage(p)}
        />
      </section>
    </div>
  );
};

export default MemberDashboard;