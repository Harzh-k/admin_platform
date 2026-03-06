import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // Added to replace unused alert
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(''); 
    
    try {
      const res = await axios.post('http://localhost:8000/admin/login', { email, password });
      
      // Removed 'name' since it wasn't used; kept 'role' for redirection
      const { role } = res.data.user;

      localStorage.setItem('user', JSON.stringify(res.data.user));

      // RBAC Redirect Logic
      if (role === 'admin') navigate('/admin-dashboard');
      else if (role === 'team_lead') navigate('/lead-dashboard');
      else navigate('/member-dashboard');

    } catch {
      // Removed 'err' to satisfy ESLint
      setErrorMsg("Authentication Failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200 mb-4">
            <Activity className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Usage<span className="text-blue-600">_Monitor</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.2em]">Enterprise AI Governance</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                <input 
                  type="email" 
                  required
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  placeholder="name@bajaj.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                <input 
                  type="password" 
                  required
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN TO HUB"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          Authorized Personnel Only
        </p>
      </div>
    </div>
  );
};

export default LoginPage;