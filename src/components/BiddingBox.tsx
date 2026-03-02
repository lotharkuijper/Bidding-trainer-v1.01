import { BidLevel, BidSuit, BiddingState } from '../types';
import { getBidValue } from '../gameSession';
import { useLanguage } from '../i18n/LanguageContext';

interface BiddingBoxProps {
  biddingState: BiddingState;
  onBid: (level: BidLevel, suit: BidSuit) => void;
  onPass: () => void;
  onDouble?: () => void;
  onRedouble?: () => void;
  allowDouble?: boolean;
  allowRedouble?: boolean;
  isOpponentBidding?: boolean;
  onAlwaysPass?: () => void;
}

const SUIT_SYMBOLS = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠',
  notrump: 'SA',
};

const SUIT_COLORS = {
  clubs: 'text-gray-900',
  diamonds: 'text-red-600',
  hearts: 'text-red-600',
  spades: 'text-gray-900',
  notrump: 'text-blue-900',
};

export function BiddingBox({ biddingState, onBid, onPass, onDouble, onRedouble, allowDouble, allowRedouble, isOpponentBidding, onAlwaysPass }: BiddingBoxProps) {
  const { t } = useLanguage();
  const levels: BidLevel[] = [1, 2, 3, 4, 5, 6, 7];
  const suits: BidSuit[] = ['clubs', 'diamonds', 'hearts', 'spades', 'notrump'];

  const lastBid = [...biddingState.bids]
    .reverse()
    .find(bid => bid.bidType === 'bid');

  const lastBidValue = lastBid && lastBid.level && lastBid.suit
    ? getBidValue(lastBid.level, lastBid.suit)
    : 0;

  const isBidAvailable = (level: BidLevel, suit: BidSuit): boolean => {
    const bidValue = getBidValue(level, suit);
    return bidValue > lastBidValue;
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 max-w-2xl mx-auto">
      <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 text-center">
        {t('bidding.placeBid')}
      </h3>

      <div className="space-y-2 mb-4">
        <button
          onClick={onPass}
          className="w-full py-3 md:py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-lg md:text-xl rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl min-h-[44px]"
        >
          {t('bidding.pass')}
        </button>

        {allowDouble && onDouble && (
          <button
            onClick={onDouble}
            className="w-full py-3 md:py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold text-lg md:text-xl rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl min-h-[44px]"
          >
            {t('bidding.double')}
          </button>
        )}

        {allowRedouble && onRedouble && (
          <button
            onClick={onRedouble}
            className="w-full py-3 md:py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold text-lg md:text-xl rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl min-h-[44px]"
          >
            {t('bidding.redouble')}
          </button>
        )}

        {isOpponentBidding && onAlwaysPass && (
          <button
            onClick={onAlwaysPass}
            className="w-full py-3 md:py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold text-lg md:text-xl rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl min-h-[44px]"
          >
            {t('bidding.alwaysPass')}
          </button>
        )}
      </div>

      <div className="mb-4 md:mb-6">
        <div className="grid grid-cols-5 gap-1 md:gap-2">
          {levels.map(level => (
            <div key={level} className="contents">
              {suits.map(suit => {
                const available = isBidAvailable(level, suit);
                const symbol = SUIT_SYMBOLS[suit];
                const color = SUIT_COLORS[suit];

                return (
                  <button
                    key={`${level}-${suit}`}
                    onClick={() => available && onBid(level, suit)}
                    disabled={!available}
                    className={`
                      py-2 md:py-3 px-1 md:px-2 rounded-md md:rounded-lg font-bold text-base md:text-lg transition-all min-h-[44px]
                      ${available
                        ? 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300 cursor-pointer shadow-md hover:shadow-lg'
                        : 'bg-gray-100 border-2 border-gray-200 cursor-not-allowed opacity-40'
                      }
                      ${color}
                    `}
                  >
                    {level}{symbol}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600 text-center">
        {isOpponentBidding
          ? t('bidding.clickToPass')
          : t('bidding.clickToBid')
        }
      </div>
    </div>
  );
}
