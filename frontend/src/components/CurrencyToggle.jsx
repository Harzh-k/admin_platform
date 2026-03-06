import React from 'react';
import { useCurrency } from '../context/CurrencyProvider';
import { DollarSign, IndianRupee } from 'lucide-react';

const CurrencyToggle = () => {
  const { isINR, toggleCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-1 bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm w-fit self-center">
      {/* USD Button */}
      <button
        onClick={() => isINR && toggleCurrency()} 
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all duration-300 ${
          !isINR 
            ? 'bg-white shadow-md text-blue-600 scale-100' 
            : 'text-slate-400 hover:text-slate-600 scale-95 opacity-70'
        }`}
      >
        <DollarSign className={`w-3 h-3 ${!isINR ? 'animate-pulse' : ''}`} />
        USD
      </button>

      {/* INR Button */}
      <button
        onClick={() => !isINR && toggleCurrency()} 
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all duration-300 ${
          isINR 
            ? 'bg-white shadow-md text-emerald-600 scale-100' 
            : 'text-slate-400 hover:text-slate-600 scale-95 opacity-70'
        }`}
      >
        <IndianRupee className={`w-3 h-3 ${isINR ? 'animate-pulse' : ''}`} />
        INR
      </button>
    </div>
  );
};

export default CurrencyToggle;