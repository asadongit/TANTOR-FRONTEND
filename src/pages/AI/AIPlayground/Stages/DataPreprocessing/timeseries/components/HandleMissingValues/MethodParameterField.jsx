import React from 'react';

function MethodParameterField({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
  disabled = false,
  hasError = false,
  errorMessage = '',
}) {
  return (
    <div className="mt-4">
      <label
        className={`block text-sm mb-2 ${
          hasError ? 'text-[#EF4D5F]' : 'text-gray-600'
        }`}
      >
        {label}
      </label>

     <input
  type="number"
  min={min}
  max={max}
  value={value}
  onChange={(e) => onChange(e.target.value)}
  disabled={disabled}
  placeholder={`${min} - ${max}`}
  className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:border-transparent ${
    hasError
      ? 'border-[#EF4D5F] bg-[#FFF7F8] text-[#EF4D5F] focus:ring-red-300'
      : 'border-gray-300 focus:ring-[#8e78b7]'
  } ${
    disabled
      ? 'bg-gray-50 cursor-not-allowed'
      : ''
  }`}
/>

      {hasError && errorMessage && (
        <p className="text-xs text-[#EF4D5F] mt-1 pl-0.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default MethodParameterField;