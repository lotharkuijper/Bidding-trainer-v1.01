export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export type Direction = 'north' | 'east' | 'south' | 'west';

export type Vulnerability = 'none' | 'ns' | 'ew' | 'all';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Hand {
  cards: Card[];
  points: number;
}

export interface Deal {
  north: Hand;
  east: Hand;
  south: Hand;
  west: Hand;
}

export interface SuitConstraint {
  min: number;
  max: number;
}

export interface SuitConstraints {
  spades: SuitConstraint;
  hearts: SuitConstraint;
  diamonds: SuitConstraint;
  clubs: SuitConstraint;
}

export interface CombinedConstraint {
  suits: Suit[];
  min: number;
  max: number;
  label?: string;
}

export interface SuitOption {
  suit: Suit;
  min: number;
  max: number;
}

export interface OrConstraint {
  label?: string;
  options: SuitOption[];
  combinedMax?: number;
}

export interface Constraints {
  northMin: number;
  northMax: number;
  southMin: number;
  southMax: number;
  eastMin: number;
  eastMax: number;
  westMin: number;
  westMax: number;
  northSuits: SuitConstraints;
  southSuits: SuitConstraints;
  eastSuits: SuitConstraints;
  westSuits: SuitConstraints;
  northCombined: CombinedConstraint[];
  southCombined: CombinedConstraint[];
  eastCombined: CombinedConstraint[];
  westCombined: CombinedConstraint[];
  northOr: OrConstraint[];
  southOr: OrConstraint[];
  eastOr: OrConstraint[];
  westOr: OrConstraint[];
}

export interface SuitDistribution {
  spades: number;
  hearts: number;
  diamonds: number;
  clubs: number;
}

export type BidLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type BidSuit = 'clubs' | 'diamonds' | 'hearts' | 'spades' | 'notrump';

export type BidType = 'bid' | 'pass' | 'double' | 'redouble';

export type BidPlayer = Direction;

export interface Bid {
  level?: BidLevel;
  suit?: BidSuit;
  bidType: BidType;
  player: BidPlayer;
  timestamp: string;
}

export interface BiddingState {
  bids: Bid[];
  startingPlayer: BidPlayer;
  currentBidder: BidPlayer;
  isComplete: boolean;
}
