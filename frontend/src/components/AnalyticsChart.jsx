import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const AnalyticsChart = ({ data, title, type = 'area' }) => {
  const BRAND_BLUE = '#0052CC';

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-[400px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
            {title || 'Analytics'}
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {type === 'area' ? 'USD Ingestion (Real-time)' : 'Token Consumption per Unit'}
          </p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="85%" minWidth={0}>
        {type === 'area' ? (
          /* AREA CHART: TIME SERIES COST */
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND_BLUE} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={BRAND_BLUE} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="cost" 
              stroke={BRAND_BLUE} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSpend)" 
            />
          </AreaChart>
        ) : (
          /* BAR CHART: TEAM COMPARISON */
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 'bold'}}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              cursor={{fill: '#F8FAFC'}}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
            />
            <Bar 
              dataKey="value" 
              fill={BRAND_BLUE} 
              radius={[10, 10, 0, 0]} 
              barSize={40} 
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;