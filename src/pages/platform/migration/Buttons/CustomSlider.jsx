import React from 'react';
import PropTypes from 'prop-types';

export function CustomSlider({ value, onChange, min = 0, max = 100, step = 5, labels }) {
  const handleChange = (e) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-between mb-1 text-sm text-gray-300">
        <span>{labels?.left || 'Test'}</span>
        <span>{labels?.right || 'Train'}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="mt-2 text-sm text-gray-300">Train/Test Split: {value}%</div>
    </div>
  );
}

CustomSlider.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  labels: PropTypes.shape({
    left: PropTypes.string,
    right: PropTypes.string
  })
};
