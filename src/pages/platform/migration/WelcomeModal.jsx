import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(true);
  const colors = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`${colors.modalBg} max-w-2xl rounded-xl shadow-2xl p-6 relative animate-fadeIn`}>
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="space-y-6">
          <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>
            Welcome to Tantor Flow Builder
          </h2>

          <div className="space-y-4">
            <p className={colors.textSecondary}>
              Build your Migration pipeline by dragging and dropping components from the sidebar onto the canvas.
            </p>

            <div className="relative h-40 border-2 border-dashed border-gray-700 rounded-lg p-4 overflow-hidden">
              {/* Animation showing drag and drop */}
              <div className="absolute left-0 animate-dragDemo">
                <div className={`${colors.nodeBg} ${colors.nodeBorder} border-2 rounded-lg p-4 w-48`}>
                  <div className={`${colors.textPrimary} font-medium`}>Sample Node</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className={`text-lg font-medium ${colors.textPrimary}`}>Quick Guide:</h3>
              <ul className={`${colors.textSecondary} space-y-2 list-disc pl-5`}>
                <li>Start by dragging an Upload CSV node to load your data</li>
                <li>Connect nodes by dragging from one handle to another</li>
                <li>Configure each node's settings as needed</li>
                <li>Delete nodes by hovering and clicking the red X button</li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className={`w-full py-3 rounded-lg ${colors.primaryButton} ${colors.textPrimary} font-medium transition-colors`}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}