import { Card, Rank, Suit } from './types';

export const POINT_VALUES: Record<Rank, number> = {
  'A': 4,
  'K': 3,
  'Q': 2,
  'J': 1,
  '10': 0,
  '9': 0,
  '8': 0,
  '7': 0,
  '6': 0,
  '5': 0,
  '4': 0,
  '3': 0,
  '2': 0,
};

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

export const SUIT_NAMES: Record<Suit, string> = {
  spades: 'Schoppen',
  hearts: 'Harten',
  diamonds: 'Ruiten',
  clubs: 'Klaveren',
};

export function getSuitName(suit: Suit, language: 'en' | 'nl'): string {
  if (language === 'en') {
    const englishNames: Record<Suit, string> = {
      spades: 'Spades',
      hearts: 'Hearts',
      diamonds: 'Diamonds',
      clubs: 'Clubs',
    };
    return englishNames[suit];
  }
  return SUIT_NAMES[suit];
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export const SUIT_ORDER: Record<Suit, number> = {
  spades: 0,
  hearts: 1,
  diamonds: 2,
  clubs: 3,
};

export function calculatePoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + POINT_VALUES[card.rank], 0);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sortHand(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (SUIT_ORDER[a.suit] !== SUIT_ORDER[b.suit]) {
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    }
    return RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank);
  });
}

export function getSuitDistribution(cards: Card[]): Record<Suit, number> {
  const distribution: Record<Suit, number> = {
    spades: 0,
    hearts: 0,
    diamonds: 0,
    clubs: 0,
  };

  for (const card of cards) {
    distribution[card.suit]++;
  }

  return distribution;
}
