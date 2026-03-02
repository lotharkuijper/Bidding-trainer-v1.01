import { useState } from 'react';
import { Constraints, Suit } from '../types';
import { SUIT_SYMBOLS, getSuitName } from '../cardUtils';
import { CombinedConstraints } from './CombinedConstraints';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface NSConstraintsModalProps {
  constraints: Constraints;
  onSave: (constraints: Constraints) => void;
  onClose: () => void;
}

export function NSConstraintsModal({ constraints, onSave, onClose }: NSConstraintsModalProps) {
  const { t, language } = useLanguage();
  const [localConstraints, setLocalConstraints] = useState(constraints);

  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

  const handleSave = () => {
    onSave(localConstraints);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{t('constraints.titleNS')}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">{t('game.north')}</h4>

              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('constraints.points')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="37"
                      value={localConstraints.northMin}
                      onChange={(e) => setLocalConstraints({
                        ...localConstraints,
                        northMin: parseInt(e.target.value) || 0
                      })}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">{t('constraints.to')}</span>
                    <input
                      type="number"
                      min="0"
                      max="37"
                      value={localConstraints.northMax}
                      onChange={(e) => setLocalConstraints({
                        ...localConstraints,
                        northMax: parseInt(e.target.value) || 37
                      })}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('constraints.distribution')}
                  </label>
                  <div className="space-y-2">
                    {suits.map(suit => (
                      <div key={suit} className="flex items-center gap-3">
                        <span className="text-xl w-8">{SUIT_SYMBOLS[suit]}</span>
                        <span className="text-sm text-gray-600 w-20">{getSuitName(suit, language)}</span>
                        <input
                          type="number"
                          min="0"
                          max="13"
                          value={localConstraints.northSuits[suit].min}
                          onChange={(e) => setLocalConstraints({
                            ...localConstraints,
                            northSuits: {
                              ...localConstraints.northSuits,
                              [suit]: {
                                ...localConstraints.northSuits[suit],
                                min: parseInt(e.target.value) || 0
                              }
                            }
                          })}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-gray-500 text-sm">-</span>
                        <input
                          type="number"
                          min="0"
                          max="13"
                          value={localConstraints.northSuits[suit].max}
                          onChange={(e) => setLocalConstraints({
                            ...localConstraints,
                            northSuits: {
                              ...localConstraints.northSuits,
                              [suit]: {
                                ...localConstraints.northSuits[suit],
                                max: parseInt(e.target.value) || 13
                              }
                            }
                          })}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <CombinedConstraints
                combinedConstraints={localConstraints.northCombined}
                orConstraints={localConstraints.northOr}
                onChange={(newCombined, newOr) => setLocalConstraints(prev => ({
                  ...prev,
                  northCombined: newCombined,
                  northOr: newOr
                }))}
                label={t('game.north')}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">{t('game.south')}</h4>

              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('constraints.points')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="37"
                      value={localConstraints.southMin}
                      onChange={(e) => setLocalConstraints({
                        ...localConstraints,
                        southMin: parseInt(e.target.value) || 0
                      })}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">{t('constraints.to')}</span>
                    <input
                      type="number"
                      min="0"
                      max="37"
                      value={localConstraints.southMax}
                      onChange={(e) => setLocalConstraints({
                        ...localConstraints,
                        southMax: parseInt(e.target.value) || 37
                      })}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('constraints.distribution')}
                  </label>
                  <div className="space-y-2">
                    {suits.map(suit => (
                      <div key={suit} className="flex items-center gap-3">
                        <span className="text-xl w-8">{SUIT_SYMBOLS[suit]}</span>
                        <span className="text-sm text-gray-600 w-20">{getSuitName(suit, language)}</span>
                        <input
                          type="number"
                          min="0"
                          max="13"
                          value={localConstraints.southSuits[suit].min}
                          onChange={(e) => setLocalConstraints({
                            ...localConstraints,
                            southSuits: {
                              ...localConstraints.southSuits,
                              [suit]: {
                                ...localConstraints.southSuits[suit],
                                min: parseInt(e.target.value) || 0
                              }
                            }
                          })}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-gray-500 text-sm">-</span>
                        <input
                          type="number"
                          min="0"
                          max="13"
                          value={localConstraints.southSuits[suit].max}
                          onChange={(e) => setLocalConstraints({
                            ...localConstraints,
                            southSuits: {
                              ...localConstraints.southSuits,
                              [suit]: {
                                ...localConstraints.southSuits[suit],
                                max: parseInt(e.target.value) || 13
                              }
                            }
                          })}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <CombinedConstraints
                combinedConstraints={localConstraints.southCombined}
                orConstraints={localConstraints.southOr}
                onChange={(newCombined, newOr) => setLocalConstraints(prev => ({
                  ...prev,
                  southCombined: newCombined,
                  southOr: newOr
                }))}
                label={t('game.south')}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('constraints.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('constraints.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
