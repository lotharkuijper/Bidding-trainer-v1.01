import { CombinedConstraint, OrConstraint, Suit, SuitOption } from '../types';
import { SUIT_SYMBOLS, getSuitName } from '../cardUtils';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

type ConstraintMode = 'and' | 'or';

interface UnifiedConstraint {
  mode: ConstraintMode;
  suits: Suit[];
  min?: number;
  max?: number;
  label?: string;
  suitOptions?: SuitOption[];
  combinedMax?: number;
}

interface CombinedConstraintsProps {
  combinedConstraints: CombinedConstraint[];
  orConstraints: OrConstraint[];
  onChange: (combined: CombinedConstraint[], or: OrConstraint[]) => void;
  label: string;
}

export function CombinedConstraints({ combinedConstraints, orConstraints, onChange, label }: CombinedConstraintsProps) {
  const { t, language } = useLanguage();
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

  const safeCombinedConstraints = combinedConstraints || [];
  const safeOrConstraints = orConstraints || [];

  const unifiedConstraints: UnifiedConstraint[] = [
    ...safeCombinedConstraints.map(c => ({
      mode: 'and' as ConstraintMode,
      suits: c.suits,
      min: c.min,
      max: c.max,
      label: c.label,
    })),
    ...safeOrConstraints.map(c => ({
      mode: 'or' as ConstraintMode,
      suits: c.options.map(o => o.suit),
      suitOptions: c.options,
      label: c.label,
      combinedMax: c.combinedMax,
    })),
  ];

  const saveUnifiedConstraints = (unified: UnifiedConstraint[]) => {
    const combined = unified
      .filter(c => c.mode === 'and')
      .map(c => ({
        suits: c.suits,
        min: c.min!,
        max: c.max!,
        label: c.label,
      }));

    const or = unified
      .filter(c => c.mode === 'or')
      .map(c => ({
        options: c.suitOptions!,
        label: c.label,
        combinedMax: c.combinedMax,
      }));

    onChange(combined, or);
  };

  const addConstraint = () => {
    saveUnifiedConstraints([
      ...unifiedConstraints,
      {
        mode: 'and',
        suits: ['spades'],
        min: 0,
        max: 13,
        label: '',
      },
    ]);
  };

  const removeConstraint = (index: number) => {
    saveUnifiedConstraints(unifiedConstraints.filter((_, i) => i !== index));
  };

  const updateConstraint = (index: number, updates: Partial<UnifiedConstraint>) => {
    const newConstraints = [...unifiedConstraints];
    newConstraints[index] = { ...newConstraints[index], ...updates };
    saveUnifiedConstraints(newConstraints);
  };

  const toggleSuit = (index: number, suit: Suit) => {
    const constraint = unifiedConstraints[index];
    const newSuits = constraint.suits.includes(suit)
      ? constraint.suits.filter(s => s !== suit)
      : [...constraint.suits, suit];

    if (newSuits.length === 0) return;

    if (constraint.mode === 'or') {
      const newSuitOptions = newSuits.map(s => {
        const existing = constraint.suitOptions?.find(o => o.suit === s);
        return existing || { suit: s, min: 5, max: 13 };
      });
      updateConstraint(index, { suits: newSuits, suitOptions: newSuitOptions });
    } else {
      updateConstraint(index, { suits: newSuits });
    }
  };

  const toggleMode = (index: number) => {
    const constraint = unifiedConstraints[index];
    const newMode = constraint.mode === 'and' ? 'or' : 'and';

    if (newMode === 'or') {
      const suitOptions: SuitOption[] = constraint.suits.map(suit => ({
        suit,
        min: 5,
        max: 13,
      }));
      updateConstraint(index, { mode: newMode, suitOptions, min: undefined, max: undefined });
    } else {
      updateConstraint(index, { mode: newMode, min: 0, max: 13, suitOptions: undefined, combinedMax: undefined });
    }
  };

  const updateSuitOption = (index: number, suit: Suit, updates: Partial<SuitOption>) => {
    const constraint = unifiedConstraints[index];
    if (constraint.mode !== 'or' || !constraint.suitOptions) return;

    const newSuitOptions = constraint.suitOptions.map(opt =>
      opt.suit === suit ? { ...opt, ...updates } : opt
    );
    updateConstraint(index, { suitOptions: newSuitOptions });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-700">{t('constraints.combinedTitle')}</h4>
        <button
          type="button"
          onClick={addConstraint}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
          {t('constraints.add')}
        </button>
      </div>

      {unifiedConstraints.length === 0 && (
        <p className="text-sm text-gray-500 italic py-2">
          {t('constraints.noCombined')}
        </p>
      )}

      <div className="space-y-3">
        {unifiedConstraints.map((constraint, index) => {
          return (
            <div
              key={index}
              className="border border-gray-300 rounded-lg p-3 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t('constraints.label')}
                </label>
                <button
                  type="button"
                  onClick={() => removeConstraint(index)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title={t('constraints.remove')}
                >
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                value={constraint.label || ''}
                onChange={(e) => updateConstraint(index, { label: e.target.value })}
                placeholder={t('constraints.labelPlaceholder')}
                className="w-full px-3 py-1 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('constraints.selectSuits')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {suits.map(suit => {
                    const isRed = suit === 'hearts' || suit === 'diamonds';
                    const isSelected = constraint.suits.includes(suit);
                    return (
                      <button
                        key={suit}
                        type="button"
                        onClick={() => toggleSuit(index, suit)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-blue-600 bg-blue-100'
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                      >
                        <span className={`text-xl ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
                          {SUIT_SYMBOLS[suit]}
                        </span>
                        <span className="text-sm font-medium">{getSuitName(suit, language)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {constraint.suits.length >= 2 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('constraints.constraintType')}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => constraint.mode === 'or' && toggleMode(index)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                        constraint.mode === 'and'
                          ? 'border-green-600 bg-green-100 text-green-800'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {t('constraints.andTotal')}
                    </button>
                    <button
                      type="button"
                      onClick={() => constraint.mode === 'and' && toggleMode(index)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                        constraint.mode === 'or'
                          ? 'border-blue-600 bg-blue-100 text-blue-800'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {t('constraints.orPerSuit')}
                    </button>
                  </div>
                </div>
              )}

              {constraint.mode === 'and' && (
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('constraints.minTotal')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="13"
                      value={constraint.min}
                      onChange={(e) =>
                        updateConstraint(index, { min: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('constraints.maxTotal')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="13"
                      value={constraint.max}
                      onChange={(e) =>
                        updateConstraint(index, { max: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {constraint.mode === 'or' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 italic">
                    {t('constraints.perSuitSeparate')}
                  </p>
                  {constraint.suitOptions?.map(option => {
                    const isRed = option.suit === 'hearts' || option.suit === 'diamonds';
                    return (
                      <div key={option.suit} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-2xl ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
                            {SUIT_SYMBOLS[option.suit]}
                          </span>
                          <span className="font-medium">{SUIT_NAMES[option.suit]}</span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('constraints.minimum')}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="13"
                              value={option.min}
                              onChange={(e) =>
                                updateSuitOption(index, option.suit, { min: parseInt(e.target.value) || 0 })
                              }
                              className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              {t('constraints.maximum')}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="13"
                              value={option.max}
                              onChange={(e) =>
                                updateSuitOption(index, option.suit, { max: parseInt(e.target.value) || 0 })
                              }
                              className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('constraints.maxTotalCombined')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="26"
                      value={constraint.combinedMax || ''}
                      placeholder={t('constraints.maxTotalPlaceholder')}
                      onChange={(e) =>
                        updateConstraint(index, { combinedMax: e.target.value ? parseInt(e.target.value) : undefined })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('constraints.leaveBlankForNoMax')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
