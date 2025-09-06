/**
 * Species Selector Component
 * Demonstrates proper configuration-driven UI component patterns
 */

import React from 'react';
import type { Species } from '@/types';

interface SpeciesSelectorProps {
  species: Species[];
  selectedSpecies: Species | null;
  onSpeciesSelect: (species: Species) => void;
  disabled?: boolean;
}

/**
 * ✅ STANDARDS COMPLIANT: Pure UI component
 * - No direct configuration access
 * - Props-based data flow
 * - No hardcoded game rules
 * - Accessible and responsive
 */
export const SpeciesSelector: React.FC<SpeciesSelectorProps> = ({
  species,
  selectedSpecies,
  onSpeciesSelect,
  disabled = false,
}) => {
  return (
    <div className="species-selector">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {species.map((speciesOption) => (
          <SpeciesCard
            key={speciesOption.name}
            species={speciesOption}
            isSelected={selectedSpecies?.name === speciesOption.name}
            onSelect={() => onSpeciesSelect(speciesOption)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};

interface SpeciesCardProps {
  species: Species;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const SpeciesCard: React.FC<SpeciesCardProps> = ({
  species,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  return (
    <div
      className={`
        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20' 
          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={disabled ? undefined : onSelect}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-selected={isSelected}
      aria-disabled={disabled}
    >
      {/* Species Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-white text-lg">{species.name}</h3>
        {isSelected && (
          <div className="text-blue-400 text-sm font-medium px-2 py-1 bg-blue-900/40 rounded">
            Selected
          </div>
        )}
      </div>

      {/* Species Description */}
      <p className="text-slate-400 text-sm mb-3 leading-relaxed">
        {species.description}
      </p>

      {/* Characteristic Modifiers */}
      {species.modifiers.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">
            Characteristic Modifiers
          </h4>
          <div className="flex flex-wrap gap-2">
            {species.modifiers.map((modifier) => (
              <ModifierBadge
                key={modifier.characteristic}
                characteristic={modifier.characteristic}
                modifier={modifier.modifier}
              />
            ))}
          </div>
        </div>
      )}

      {/* Homeworld */}
      {species.homeworld && (
        <div className="mb-3">
          <span className="text-xs text-slate-500">Homeworld: </span>
          <span className="text-slate-300 text-sm">{species.homeworld}</span>
        </div>
      )}

      {/* Special Rules */}
      {species.specialRules && species.specialRules.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">
            Special Rules
          </h4>
          <ul className="space-y-1">
            {species.specialRules.map((rule, index) => (
              <li key={index} className="text-xs text-slate-400 leading-relaxed">
                • {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface ModifierBadgeProps {
  characteristic: string;
  modifier: number;
}

const ModifierBadge: React.FC<ModifierBadgeProps> = ({ characteristic, modifier }) => {
  const isPositive = modifier >= 0;
  const colorClasses = isPositive 
    ? 'bg-green-900/30 text-green-400 border-green-700/50' 
    : 'bg-red-900/30 text-red-400 border-red-700/50';

  return (
    <span 
      className={`
        inline-flex items-center px-2 py-1 text-xs font-mono rounded border
        ${colorClasses}
      `}
      title={`${characteristic} ${isPositive ? '+' : ''}${modifier}`}
    >
      <span className="font-semibold">{characteristic}</span>
      <span className="ml-1">
        {isPositive ? '+' : ''}{modifier}
      </span>
    </span>
  );
};
