import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { adminService } from '../services/api';

// Components
import StatCard from '../components/StatCard';
import UsageTable from '../components/UsageTable';
import AnalyticsChart from '../components/AnalyticsChart';
import TeamGrid from '../components/TeamGrid';
import BreachRegistry from '../components/BreachRegistry';
import CreateTeamModal from '../components/CreateTeamModal';
import SettingsModal from '../components/SettingsModal';
import MemberModal from '../components/MemberModal';
import Leaderboard from '../components/Leaderboard';
import EditTeamModal from '../components/EditTeamModal';
import ModelCatalogTable from '../components/ModelCatalogTable'; // NEW IMPORT

// Icons
import { Activity, RefreshCw, Settings, LogOut, Lock, ShieldCheck, KeyRound } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [data, setData] = useState({ 
    stats: { total_spend: 0, active_teams: 0, budget_usage: 100, total_tokens: 0 }, 
    teams: [], 
    history: [], 
    totalHistory: 0,
    totalPages: 1,
    violations: [],
    leaderboard: [],
    tokenStats: [] 
  });
  
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPassForm, setShowPassForm] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);
  
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState(null);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState(null);
  const [uiRefreshing, setUiRefreshing] = useState(false);
  
  const isFetching = useRef(false);
  const isMounted = useRef(true);
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("Passwords do not match!");
    setPassLoading(true);
    try {
      await axios.post('http://localhost:8000/admin/change-password', {
        email: user.email,
        old_password: passData.old,
        new_password: passData.new
      });
      alert("Admin Master Password Updated. Please login again.");
      handleLogout();
    } catch (err) {
      alert(err.response?.data?.detail || "Security update failed");
    } finally {
      setPassLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setUiRefreshing(true);
    try {
      const [s, t, h, v, l, ts] = await Promise.all([
        adminService.getStats(),
        adminService.getTeams(),
        adminService.getUsageHistory(page), 
        adminService.getViolations(),
        adminService.getLeaderboard(),
        adminService.getTeamTokenStats()
      ]);

      if (isMounted.current) {
        setData({ 
          stats: s.data || { total_spend: 0, active_teams: 0, budget_usage: 100, total_tokens: 0 }, 
          teams: Array.isArray(t.data) ? t.data : [], 
          history: h.data?.items || [], 
          totalHistory: h.data?.total || 0,
          totalPages: h.data?.total_pages || 1,
          violations: Array.isArray(v.data) ? v.data : [],
          leaderboard: Array.isArray(l.data) ? l.data : [],
          tokenStats: Array.isArray(ts.data) ? ts.data : [] 
        });
      }
    } catch (err) { 
      console.error("❌ SYNC FAILED:", err); 
    } finally {
      if (isMounted.current) {
        isFetching.current = false;
        setTimeout(() => setUiRefreshing(false), 800);
      }
    }
  }, [page]);

  useEffect(() => { 
    isMounted.current = true;
    fetchData();
    const inv = setInterval(fetchData, 8000); 
    return () => {
      isMounted.current = false;
      clearInterval(inv);
    };
  }, [fetchData]);

  const costChartData = data.history.length > 0 
    ? [...data.history].reverse().map(i => ({
        time: i.time,
        cost: typeof i.cost === 'string' ? parseFloat(i.cost.replace('$', '')) : i.cost
      })) 
    : [{ time: '00:00', cost: 0 }];

  const tokenChartData = data.tokenStats.length > 0
    ? data.tokenStats.map(t => ({ name: t.team, value: t.tokens }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8 font-sans">
      {/* HEADER */}
      <header className="flex justify-between items-center bg-white p-3 px-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-100">
            <Activity className="text-white w-4 h-4" />
          </div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">
            Usage<span className="text-blue-600">_Monitor</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {uiRefreshing && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mr-1" />}
          <button onClick={() => setShowPassForm(!showPassForm)} className={`p-2 rounded-lg transition-all ${showPassForm ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-900'}`} title="Update Security Credentials">
            <Lock className="w-5 h-5" />
          </button>
          {/* <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all" title="System Configuration">
            <Settings className="w-5 h-5" />
          </button> */}
          <button onClick={handleLogout} className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all" title="Sign Out">
            <LogOut className="w-5 h-5" />
          </button>          
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-95 ml-2">
            + New Team
          </button>
        </div>
      </header>

      {/* ADMIN SECURITY FORM */}
      {showPassForm && (
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 relative overflow-hidden animate-in slide-in-from-top-4 duration-300 mb-8">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck className="w-32 h-32 text-white" /></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white/20 p-2 rounded-lg border border-white/30 backdrop-blur-md">
                        <KeyRound className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Master Password Update</h2>
                        <p className="text-[10px] text-blue-100 font-bold uppercase mt-1 tracking-tighter italic">Warning: This will reset the global root access key.</p>
                    </div>
                </div>
                <form onSubmit={handlePasswordUpdate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="password" placeholder="Current Password" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none backdrop-blur-sm" onChange={(e) => setPassData({...passData, old: e.target.value})} />
                    <input type="password" placeholder="New Master Key" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none backdrop-blur-sm" onChange={(e) => setPassData({...passData, new: e.target.value})} />
                    <input type="password" placeholder="Confirm Key" required className="bg-white/10 border border-white/20 p-3 rounded-xl text-xs text-white placeholder:text-blue-100 outline-none backdrop-blur-sm" onChange={(e) => setPassData({...passData, confirm: e.target.value})} />
                    <button type="submit" disabled={passLoading} className="bg-white text-blue-600 font-black rounded-xl text-[10px] uppercase hover:bg-blue-50 active:scale-95 disabled:opacity-50 shadow-lg">
                        {passLoading ? 'Encrypting...' : 'Update Root'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* SECTION 1: STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Total Enterprise Spend" value={`$${(data.stats.total_spend || 0).toFixed(4)}`} />
        <StatCard title="Active AI Teams" value={data.stats.active_teams || 0} />
        <StatCard title="Token Volume" value={(data.stats.total_tokens || 0).toLocaleString()} />
      </div>

      {/* SECTION 2: ANALYTICS & TOKEN CONSUMPTION */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-2">
          <AnalyticsChart 
            type="area"
            title="Enterprise Spend Analysis"
            data={costChartData} 
          />
        </div>

        <div className="xl:col-span-2">
            <AnalyticsChart 
                type="bar"
                title="Team Token Distribution"
                data={tokenChartData}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-2"><Leaderboard data={data.leaderboard} /></div>
        <div className="xl:col-span-2"><BreachRegistry violations={data.violations} /></div>
      </div>

      {/* NEW SECTION 3: MODEL INTELLIGENCE CATALOG */}
      <section>
        <ModelCatalogTable />
      </section>

      {/* SECTION 4: MANAGED UNITS */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900">Managed Units</h2>
            <p className="text-slate-400 text-sm">Real-time budget allocation and membership</p>
        </div>
        <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide snap-x">
          <TeamGrid teams={data.teams} onManageMembers={(team) => setSelectedTeamForMembers(team)} onEditTeam={(team) => setSelectedTeamForEdit(team)} onTeamUpdated={fetchData} layout="horizontal" />
        </div>
      </section>

      {/* SECTION 5: AUDIT TRAIL */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-black text-slate-900">Live Audit Trail</h2>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Secured</span>
        </div>
        <UsageTable data={data.history} total={data.totalHistory} currentPage={page} totalPages={data.totalPages} onPageChange={(p) => setPage(p)} />
      </section>

      {/* MODALS */}
      <CreateTeamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTeamCreated={fetchData} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <MemberModal isOpen={!!selectedTeamForMembers} onClose={() => setSelectedTeamForMembers(null)} team={selectedTeamForMembers} />
      <EditTeamModal isOpen={!!selectedTeamForEdit} onClose={() => setSelectedTeamForEdit(null)} team={selectedTeamForEdit} onTeamUpdated={fetchData} />
    </div>
  );
};

export default Dashboard;