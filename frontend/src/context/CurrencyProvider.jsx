/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CurrencyContext } from './CurrencyContext';

export const CurrencyProvider = ({ children }) => {
  const [isINR, setIsINR] = useState(() => localStorage.getItem('currency_pref') === 'INR');
  const [fxRate, setFxRate] = useState(83.50);

  useEffect(() => {
    axios.get('http://localhost:8000/admin/system/settings')
      .then(res => res.data?.usd_to_inr && setFxRate(res.data.usd_to_inr))
      .catch(err => console.error("FX Sync failed:", err.message));
  }, []);

  const formatValue = (usdAmount) => {
    const amount = parseFloat(usdAmount) || 0;
    return isINR 
      ? `₹${(amount * fxRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
      : `$${amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ isINR, setIsINR, formatValue }}>
      {children}
    </CurrencyContext.Provider>
  );
};