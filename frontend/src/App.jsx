import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';       // Admin View
import LeadDashboard from './pages/LeadDashboard'; // Team Lead View
import MemberDashboard from './pages/MemberDashboard'; // Standard Member View

// --- ROLE-BASED PROTECTION COMPONENT ---
const ProtectedRoute = ({ children, allowedRole }) => {
  const userStr = localStorage.getItem('user');
  
  // 1. Redirect to login if not authenticated
  if (!userStr) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  
  // 2. Check Role Authorization
  // We check user.role because that is what your login API returns
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Dashboard: Full Access */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Team Lead Dashboard: Scoped to their unit */}
        <Route 
          path="/lead-dashboard" 
          element={
            <ProtectedRoute allowedRole="team_lead">
              <LeadDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Member Dashboard: Personal Usage only */}
        <Route 
          path="/member-dashboard" 
          element={
            <ProtectedRoute allowedRole="member">
              <MemberDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Root Path Management */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Professional 404 Handler */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
            <h1 className="text-4xl font-black text-slate-200">404</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Resource Not Found</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="mt-6 bg-white border border-slate-200 px-6 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all shadow-sm"
            >
              Return to Safety
            </button>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;