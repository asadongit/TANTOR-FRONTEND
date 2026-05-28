import React from 'react';

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
    <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
    <div className={`w-11 h-6 ${disabled ? 'bg-gray-200' : 'bg-gray-300'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${disabled ? 'peer-checked:bg-[#a899c9]' : 'peer-checked:bg-[#8E77BB]'}`}></div>
  </label>
);

export default ToggleSwitch;