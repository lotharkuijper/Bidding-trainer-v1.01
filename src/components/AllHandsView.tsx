import { Deal, Suit } from '../types';
import { sortHand, SUIT_SYMBOLS, getSuitName } from '../cardUtils';
import { CardDisplay } from './CardDisplay';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface AllHandsViewProps {
  deal: Deal;
  onClose: () => void;
}

export function AllHandsView({ deal, onClose }: AllHandsViewProps) {
  const { t, language } = useLanguage();
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const pointsLabel = language === 'en' ? 'points' : 'punten';

  const renderHand = (hand: typeof deal.north, position: 'north' | 'south' | 'east' | 'west', positionLabel: string) => {
    const sortedCards = sortHand(hand.cards);
    const cardsBySuit = {
      spades: sortedCards.filter(c => c.suit === 'spades'),
      hearts: sortedCards.filter(c => c.suit === 'hearts'),
      diamonds: sortedCards.filter(c => c.suit === 'diamonds'),
      clubs: sortedCards.filter(c => c.suit === 'clubs'),
    };

    const isVertical = position === 'east' || position === 'west';

    return (
      <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl shadow-xl p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm md:text-base font-bold text-white">{positionLabel}</h3>
          <div className="bg-yellow-400 text-gray-900 font-bold px-2 py-1 rounded text-xs md:text-sm">
            {hand.points} {pointsLabel}
          </div>
        </div>
        <div className={`space-y-1.5 ${isVertical ? 'text-sm' : ''}`}>
          {suits.map(suit => (
            <div key={suit} className="flex items-start gap-1.5 md:gap-2">
              <div className={`font-bold text-base md:text-lg min-w-[24px] ${suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-white'}`}>
                {SUIT_SYMBOLS[suit]}
              </div>
              <div className="flex-1 flex flex-wrap gap-1">
                {cardsBySuit[suit].length > 0 ? (
                  cardsBySuit[suit].map((card, idx) => (
                    <CardDisplay key={idx} card={card} />
                  ))
                ) : (
                  <span className="text-gray-300 italic text-sm">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('allHands.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* North - top center */}
            <div className="md:col-start-2">
              {renderHand(deal.north, 'north', t('game.north'))}
            </div>

            {/* West - middle left, East - middle right */}
            <div className="md:col-start-1 md:row-start-2">
              {renderHand(deal.west, 'west', t('game.west'))}
            </div>
            <div className="md:col-start-3 md:row-start-2">
              {renderHand(deal.east, 'east', t('game.east'))}
            </div>

            {/* South - bottom center */}
            <div className="md:col-start-2 md:row-start-3">
              {renderHand(deal.south, 'south', t('game.south'))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('allHands.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
