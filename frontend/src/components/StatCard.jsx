import React from 'react';

const StatCard = ({ title, value, colorClass = "text-brand-blue", icon }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={`text-3xl font-extrabold mt-3 ${colorClass}`}>{value}</p>
      </div>
      {icon && (
        <div className="bg-slate-50 p-3 rounded-xl">
          {icon}
        </div>
      )}
    </div>
  );
};

export default StatCard;