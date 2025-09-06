/**
 * Progress Indicator Component
 * Shows current position in character creation workflow
 */

import React from 'react';
import { useStepEngine } from './StepEngineIntegration';

export interface ProgressIndicatorProps {
  className?: string;
}

/**
 * ✅ STANDARDS COMPLIANT: Configuration-driven progress display
 * - Progress calculated from step engine configuration
 * - No hardcoded phase or step information
 * - Responsive and accessible design
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ className = '' }) => {
  const { progress, currentPhaseData } = useStepEngine();

  if (!progress || !currentPhaseData) {
    return null;
  }

  return (
    <div className={`progress-indicator ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span>Phase {progress.currentPhaseIndex + 1} of {progress.totalPhases}</span>
          <span>{progress.overallProgress}% Complete</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">{currentPhaseData.title}</h2>
        <p className="text-sm text-slate-400 mt-1">{currentPhaseData.description}</p>
        <div className="text-xs text-slate-500 mt-2">
          Step {progress.currentStepIndex + 1} of {progress.totalStepsInPhase}
        </div>
      </div>
    </div>
  );
};
