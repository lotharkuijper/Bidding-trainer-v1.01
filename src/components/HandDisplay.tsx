import { Hand, Suit } from '../types';
import { sortHand, SUIT_NAMES, SUIT_SYMBOLS } from '../cardUtils';
import { CardDisplay } from './CardDisplay';
import { useLanguage } from '../i18n/LanguageContext';

interface HandDisplayProps {
  hand: Hand;
  label: string;
  position: 'north' | 'south';
}

export function HandDisplay({ hand, label, position }: HandDisplayProps) {
  const { language } = useLanguage();
  const sortedCards = sortHand(hand.cards);

  const cardsBySuit = {
    spades: sortedCards.filter(c => c.suit === 'spades'),
    hearts: sortedCards.filter(c => c.suit === 'hearts'),
    diamonds: sortedCards.filter(c => c.suit === 'diamonds'),
    clubs: sortedCards.filter(c => c.suit === 'clubs'),
  };

  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

  const pointsLabel = language === 'en' ? 'points' : 'punten';

  return (
    <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl shadow-2xl p-4 md:p-6 h-full">
      <div className="flex justify-between items-center mb-3 md:mb-4">
        <h2 className="text-lg md:text-2xl font-bold text-white">{label}</h2>
        <div className="bg-yellow-400 text-gray-900 font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-lg shadow-md text-sm md:text-base">
          {hand.points} {pointsLabel}
        </div>
      </div>

      <div className="space-y-2 md:space-y-3">
        {suits.map(suit => (
          <div key={suit} className="flex items-start gap-2 md:gap-3">
            <div className={`font-bold text-xl md:text-2xl min-w-[32px] md:min-w-[40px] ${suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-white'}`}>
              {SUIT_SYMBOLS[suit]}
            </div>
            <div className="flex-1 flex flex-wrap gap-1.5 md:gap-2">
              {cardsBySuit[suit].length > 0 ? (
                cardsBySuit[suit].map((card, idx) => (
                  <CardDisplay key={idx} card={card} />
                ))
              ) : (
                <span className="text-gray-300 italic">-</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
