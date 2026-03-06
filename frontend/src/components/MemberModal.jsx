import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { X, UserPlus, Users, Trash2, Mail, Shield, ShieldCheck } from 'lucide-react';

const MemberModal = ({ isOpen, onClose, team }) => {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ email: '', name: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (isOpen && team) {
      fetchMembers();
      setMsg(null); 
    }
  }, [isOpen, team]);

  const fetchMembers = async () => {
    try {
      const res = await adminService.getTeamMembers(team.id);
      setMembers(res.data);
    } catch (error) {
      console.error("Failed to load members:", error);
      setMsg({ type: 'error', text: 'Could not load member list.' });
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.email || !newMember.name) return;

    setLoading(true);
    setMsg(null);

    try {
      await adminService.addTeamMember(team.id, {
        email: newMember.email.toLowerCase().trim(),
        full_name: newMember.name.trim(),
        role: newMember.role
      });
      
      setMsg({ type: 'success', text: 'Member added successfully!' });
      setNewMember({ email: '', name: '', role: 'member' });
      fetchMembers(); // Refresh list
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to add member';
      setMsg({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm(`Revoke AI access for ${email}?`)) return;

    try {
      await adminService.removeTeamMember(team.id, email);
      setMsg({ type: 'success', text: 'Access revoked successfully.' });
      fetchMembers(); // Refresh list
    } catch (error) {
      console.error("Delete member failed:", error);
      setMsg({ type: 'error', text: 'Failed to remove member.' });
    }
  };

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] border border-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
              <Users className="text-blue-600 w-7 h-7" /> {team.name} <span className="text-slate-400 font-light">Members</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1">Manage team access and assigned roles</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Add New Member Form */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60 shadow-inner">
            <h3 className="text-xs font-black text-slate-400 uppercase mb-4 flex items-center gap-2 tracking-widest">
              <UserPlus className="w-4 h-4" /> Onboard Member
            </h3>
            <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Full Name" 
                className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
                value={newMember.name}
                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                required
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
                value={newMember.email}
                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                required
              />
              <div className="flex gap-2">
                <select 
                  className="p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-bold flex-1"
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                >
                  <option value="member">Member</option>
                  <option value="lead">Team Lead</option>
                </select>
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-slate-900 text-white px-5 rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-slate-200"
                >
                  {loading ? '...' : 'Add'}
                </button>
              </div>
            </form>
            {msg && (
              <div className={`mt-4 p-3 rounded-xl text-center text-[11px] font-black uppercase tracking-wider border ${
                msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {msg.text}
              </div>
            )}
          </div>

          {/* Section 2: Members List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Authorized Access ({members.length})</h3>
            </div>
            
            <div className="space-y-2">
              {members.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 flex flex-col items-center gap-2">
                  <Users className="w-10 h-10 opacity-20" />
                  <p className="text-sm">This team is currently empty.</p>
                </div>
              ) : (
                members.map((m, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-100 hover:shadow-lg hover:shadow-slate-100/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${
                        m.role === 'lead' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{m.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {m.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          m.role === 'lead' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {m.role === 'lead' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {m.role}
                        </span>
                        <span className="text-[9px] text-slate-300 mt-1 uppercase font-bold tracking-tighter">Joined: {m.joined}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(m.email)}
                        className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="p-4 bg-slate-50 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest rounded-b-3xl">
          Secure Identity Management &copy; 2026
        </div>
      </div>
    </div>
  );
};

export default MemberModal;