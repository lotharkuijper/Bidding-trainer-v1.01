import { Card } from '../types';
import { SUIT_SYMBOLS } from '../cardUtils';

interface CardDisplayProps {
  card: Card;
}

export function CardDisplay({ card }: CardDisplayProps) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  return (
    <div className="inline-flex items-center justify-center bg-white rounded-md md:rounded-lg shadow-md border-2 border-gray-300 px-1.5 md:px-2 py-0.5 md:py-1 min-w-[40px] md:min-w-[50px] text-center">
      <span className={`font-bold text-base md:text-lg ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {SUIT_SYMBOLS[card.suit]}{card.rank}
      </span>
    </div>
  );
}
