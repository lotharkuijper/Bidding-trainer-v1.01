import { Bid, BiddingState, BidPlayer, Direction } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface BiddingHistoryProps {
  biddingState: BiddingState;
  dealer: Direction;
  myPosition: BidPlayer;
}

const SUIT_SYMBOLS = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠',
  notrump: 'SA',
};

const SUIT_COLORS = {
  clubs: 'text-gray-900 font-black text-xl',
  diamonds: 'text-red-600',
  hearts: 'text-red-600',
  spades: 'text-gray-900',
  notrump: 'text-blue-900',
};

export function BiddingHistory({ biddingState, dealer, myPosition }: BiddingHistoryProps) {
  const { t } = useLanguage();

  const formatBid = (bid: Bid): { text: string; color: string } => {
    if (bid.bidType === 'pass') {
      return { text: t('bidding.bidPass'), color: 'text-gray-600 italic' };
    }

    if (bid.bidType === 'double') {
      return { text: t('bidding.bidDouble'), color: 'text-orange-600 font-bold' };
    }

    if (bid.bidType === 'redouble') {
      return { text: t('bidding.bidRedouble'), color: 'text-purple-600 font-bold' };
    }

    if (bid.bidType === 'bid' && bid.level && bid.suit) {
      const symbol = SUIT_SYMBOLS[bid.suit];
      const color = SUIT_COLORS[bid.suit];
      return { text: `${bid.level}${symbol}`, color };
    }

    return { text: '-', color: 'text-gray-400' };
  };
  if (!biddingState || biddingState.bids.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
          {t('bidding.history')}
        </h3>
        <div className="text-center py-6 md:py-8 text-gray-500">
          <p className="text-sm md:text-base">{t('bidding.noBidsYet')}</p>
          <p className="text-xs md:text-sm mt-2">{t('bidding.startBidding')}</p>
        </div>
      </div>
    );
  }

  // Fixed column order: West, North, East, South
  const columns = [
    { position: 'west' as Direction, label: t('game.west') },
    { position: 'north' as Direction, label: t('game.north') },
    { position: 'east' as Direction, label: t('game.east') },
    { position: 'south' as Direction, label: t('game.south') },
  ];

  // Determine the position of each player in the columns
  const getColumnIndex = (player: BidPlayer): number => {
    return columns.findIndex(col => col.position === player);
  };

  const dealerIndex = getColumnIndex(dealer);
  const southIndex = 3; // South is always at index 3

  // Group bids into rows
  const rows: (Bid | null)[][] = [];
  let currentRow: (Bid | null)[] = [null, null, null, null]; // [west, north, east, south]
  let isFirstRow = true;

  // Initialize first row with nulls before the dealer position
  for (let i = 0; i < dealerIndex; i++) {
    currentRow[i] = null;
  }

  // Process each bid
  biddingState.bids.forEach((bid, index) => {
    const columnIndex = getColumnIndex(bid.player);
    if (columnIndex !== -1) {
      currentRow[columnIndex] = bid;

      // Start a new row after South bids (index 3)
      // For the first row, only break after South if we've started from the dealer
      // For subsequent rows, always break after South
      if (columnIndex === southIndex && index < biddingState.bids.length - 1) {
        rows.push(currentRow);
        currentRow = [null, null, null, null];
        isFirstRow = false;
      }
    }
  });

  // Add the last row if it has any bids
  if (currentRow.some(cell => cell !== null)) {
    rows.push(currentRow);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
        {t('bidding.history')}
      </h3>

      <div className="overflow-x-auto -mx-2 md:mx-0">
        <table className="w-full border-collapse min-w-[280px]">
          <thead>
            <tr className="border-b-2 border-gray-300">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-1.5 md:py-2 px-2 md:px-4 text-center font-bold text-xs md:text-base ${
                    col.position === myPosition
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700'
                  }`}
                >
                  <span className="block md:inline">{col.label}</span>
                  {col.position === dealer && (
                    <span className="ml-1 text-xs">🎯</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-gray-200">
                {row.map((bid, colIdx) => {
                  const column = columns[colIdx];
                  const isMyBid = bid && bid.player === myPosition;

                  const formattedBid = bid ? formatBid(bid) : { text: '', color: '' };

                  return (
                    <td
                      key={colIdx}
                      className={`py-2 md:py-3 px-2 md:px-4 text-center font-semibold text-base md:text-lg ${
                        isMyBid ? 'bg-blue-50' : ''
                      }`}
                    >
                      {bid && (
                        <span className={formattedBid.color}>
                          {formattedBid.text}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 md:mt-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
          <span>{t('bidding.yourBids')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🎯 = {t('bidding.dealerLabel')}</span>
        </div>
      </div>
    </div>
  );
}
