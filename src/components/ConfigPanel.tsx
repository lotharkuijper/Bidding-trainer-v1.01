import { useState, useRef, useEffect } from 'react';
import { Constraints, Direction, Vulnerability } from '../types';
import { Settings, ChevronDown, X } from 'lucide-react';
import { DealerVulnerabilityModal } from './DealerVulnerabilityModal';
import { NSConstraintsModal } from './NSConstraintsModal';
import { EWConstraintsModal } from './EWConstraintsModal';
import { useLanguage } from '../i18n/LanguageContext';

interface ConfigPanelProps {
  constraints: Constraints;
  dealer: Direction;
  vulnerability: Vulnerability;
  lockDealer: boolean;
  lockVulnerability: boolean;
  allowUndoBid: boolean;
  allowOpponentBidding: boolean;
  onSettingsChangeAndDeal: (constraints: Constraints, dealer: Direction, vulnerability: Vulnerability, lockDealer?: boolean, lockVulnerability?: boolean, allowUndoBid?: boolean, allowOpponentBidding?: boolean) => void;
  onDeal: () => void;
}

type ModalType = 'none' | 'dealer' | 'ns' | 'ew' | 'bidding';

export function ConfigPanel({ constraints, dealer, vulnerability, lockDealer, lockVulnerability, allowUndoBid, allowOpponentBidding, onSettingsChangeAndDeal, onDeal }: ConfigPanelProps) {
  const { t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [localDealer, setLocalDealer] = useState(dealer);
  const [localVulnerability, setLocalVulnerability] = useState(vulnerability);
  const [localLockDealer, setLocalLockDealer] = useState(lockDealer);
  const [localLockVulnerability, setLocalLockVulnerability] = useState(lockVulnerability);
  const [localAllowUndoBid, setLocalAllowUndoBid] = useState(allowUndoBid);
  const [localAllowOpponentBidding, setLocalAllowOpponentBidding] = useState(allowOpponentBidding);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalDealer(dealer);
    setLocalVulnerability(vulnerability);
    setLocalLockDealer(lockDealer);
    setLocalLockVulnerability(lockVulnerability);
    setLocalAllowUndoBid(allowUndoBid);
    setLocalAllowOpponentBidding(allowOpponentBidding);
  }, [dealer, vulnerability, lockDealer, lockVulnerability, allowUndoBid, allowOpponentBidding]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDealerVulnerabilityClose = () => {
    setActiveModal('none');
    onSettingsChangeAndDeal(constraints, localDealer, localVulnerability, localLockDealer, localLockVulnerability);
  };

  const handleBiddingSettingsClose = () => {
    setActiveModal('none');
    onSettingsChangeAndDeal(constraints, dealer, vulnerability, undefined, undefined, localAllowUndoBid, localAllowOpponentBidding);
  };

  const handleNSConstraintsSave = (newConstraints: Constraints) => {
    onSettingsChangeAndDeal(newConstraints, dealer, vulnerability);
  };

  const handleEWConstraintsSave = (newConstraints: Constraints) => {
    onSettingsChangeAndDeal(newConstraints, dealer, vulnerability);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-center justify-between">
          <div className="relative w-full md:w-auto" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center justify-center gap-2 px-5 md:px-6 py-3 bg-blue-600 text-white text-sm md:text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md w-full md:w-auto min-h-[44px]"
            >
              <Settings size={20} />
              {t('config.options')}
              <ChevronDown size={18} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 md:right-auto mt-2 md:w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    setActiveModal('dealer');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 text-sm md:text-base font-medium min-h-[44px]"
                >
                  {t('config.changeDealer')}
                </button>
                <button
                  onClick={() => {
                    setActiveModal('ns');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 text-sm md:text-base font-medium min-h-[44px]"
                >
                  {t('config.changeNSConstraints')}
                </button>
                <button
                  onClick={() => {
                    setActiveModal('ew');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 text-sm md:text-base font-medium min-h-[44px]"
                >
                  {t('config.changeEWConstraints')}
                </button>
                <button
                  onClick={() => {
                    setActiveModal('bidding');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors text-gray-700 text-sm md:text-base font-medium min-h-[44px]"
                >
                  {t('config.biddingSettings')}
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onDeal}
            className="px-5 md:px-6 py-3 bg-green-600 text-white text-sm md:text-base font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md w-full md:w-auto min-h-[44px]"
          >
            {t('config.redeal')}
          </button>
        </div>
      </div>

      {activeModal === 'dealer' && (
        <DealerVulnerabilityModal
          dealer={localDealer}
          vulnerability={localVulnerability}
          lockDealer={localLockDealer}
          lockVulnerability={localLockVulnerability}
          onDealerChange={setLocalDealer}
          onVulnerabilityChange={setLocalVulnerability}
          onLockDealerChange={setLocalLockDealer}
          onLockVulnerabilityChange={setLocalLockVulnerability}
          onClose={handleDealerVulnerabilityClose}
        />
      )}

      {activeModal === 'ns' && (
        <NSConstraintsModal
          constraints={constraints}
          onSave={handleNSConstraintsSave}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'ew' && (
        <EWConstraintsModal
          constraints={constraints}
          onSave={handleEWConstraintsSave}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'bidding' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{t('config.biddingSettings')}</h3>
              <button
                onClick={handleBiddingSettingsClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={localAllowUndoBid}
                  onChange={(e) => setLocalAllowUndoBid(e.target.checked)}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <span className="text-gray-900 font-medium block">{t('config.allowUndoBid')}</span>
                  <span className="text-sm text-gray-500">{t('config.allowUndoBidDesc')}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={localAllowOpponentBidding}
                  onChange={(e) => setLocalAllowOpponentBidding(e.target.checked)}
                  className="w-5 h-5 text-blue-600"
                />
                <div>
                  <span className="text-gray-900 font-medium block">{t('config.allowOpponentBidding')}</span>
                  <span className="text-sm text-gray-500">{t('config.allowOpponentBiddingDesc')}</span>
                </div>
              </label>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handleBiddingSettingsClose}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('config.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
