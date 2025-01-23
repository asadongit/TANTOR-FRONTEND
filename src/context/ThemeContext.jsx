import { createContext, useContext } from 'react';

export const themeColors = {
  // Node Colors
  nodeBg: 'bg-gray-800',
  nodeBorder: 'border-gray-700',
  nodeHover: 'hover:border-gray-600',

  // Special Nodes
  uploadNodeBorder: 'border-[#8E77BB]',
  dataNodeBorder: 'border-blue-500',

  // Flow Elements
  handleBg: 'bg-blue-500',
  handleConnecting: 'bg-green-500',
  handleValid: 'bg-green-500',
  edgePath: 'stroke-gray-400',

  // Controls
  controlBg: 'bg-gray-800',
  controlBorder: 'border-gray-700',
  controlHover: 'hover:bg-gray-700',

  // Modal/Drawer
  modalBg: 'bg-gray-900',
  modalBorder: 'border-gray-700',
  drawerBg: 'bg-gray-900',

  // Buttons
  primaryButton: 'bg-blue-600 hover:bg-blue-700',
  secondaryButton: 'bg-gray-700 hover:bg-gray-600',
  dangerButton: 'bg-red-500 hover:bg-red-600',

  // Text
  textPrimary: 'text-white',
  textSecondary: 'text-gray-300',
  textMuted: 'text-gray-400'
};

const ThemeContext = createContext(themeColors);

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={themeColors}>
      {children}
    </ThemeContext.Provider>
  );
}