import React from 'react';

/**
 * =========================================================
 * ToggleSwitch Component
 * =========================================================

 */

function ToggleSwitch({

  /**
   * Current switch state
   */
  checked,

  /**
   * Toggle handler
   */
  onChange,

  /**
   * Disable switch interaction
   */
  disabled
}) {

  return (

    <label
      className={`
        relative
        inline-flex
        items-center

        ${
          disabled
            ? 'cursor-not-allowed opacity-70'
            : 'cursor-pointer'
        }
      `}
    >

      {/* ===================================================
          Hidden Native Checkbox
      =================================================== */}

      <input
        type="checkbox"

        checked={checked}

        onChange={onChange}

        disabled={disabled}

        className="sr-only peer"
      />

      {/* ===================================================
          Toggle Background
      =================================================== */}

      <div
        className={`
          w-11
          h-6
          bg-gray-300
          rounded-full
          transition-all

          peer-focus:outline-none

          peer-checked:bg-[#8e78b7]

          after:content-['']
          after:absolute
          after:top-[2px]
          after:left-[2px]

          after:bg-white
          after:border
          after:border-gray-300

          after:rounded-full
          after:h-5
          after:w-5

          after:transition-all

          peer-checked:after:translate-x-full
          peer-checked:after:border-white
        `}
      />

    </label>
  );
}

export default ToggleSwitch;