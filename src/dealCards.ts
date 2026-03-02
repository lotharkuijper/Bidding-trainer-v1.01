import { Card, Constraints, Deal, Suit, SuitConstraints, Rank } from './types';
import { calculatePoints, SUITS } from './cardUtils';

const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

function createFullDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getSuitDistribution(cards: Card[]): Record<Suit, number> {
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

function meetsConstraints(
  cards: Card[],
  suitConstraints: SuitConstraints,
  minPoints: number,
  maxPoints: number,
  combinedConstraints: import('./types').CombinedConstraint[],
  orConstraints: import('./types').OrConstraint[]
): boolean {
  const distribution = getSuitDistribution(cards);

  for (const suit of SUITS) {
    const count = distribution[suit];
    const constraint = suitConstraints[suit];
    if (count < constraint.min || count > constraint.max) {
      console.log(`Suit constraint failed: ${suit} has ${count}, needs ${constraint.min}-${constraint.max}`);
      return false;
    }
  }

  for (const combined of combinedConstraints) {
    const total = combined.suits.reduce((sum, suit) => sum + distribution[suit], 0);
    if (total < combined.min || total > combined.max) {
      console.log(`Combined constraint failed: ${combined.suits.join('+')} has ${total}, needs ${combined.min}-${combined.max}`);
      return false;
    }
  }

  for (const orConstraint of orConstraints) {
    let anyOptionMet = false;
    for (const option of orConstraint.options) {
      const count = distribution[option.suit];
      if (count >= option.min && count <= option.max) {
        anyOptionMet = true;
        break;
      }
    }

    if (!anyOptionMet) {
      const optionsStr = orConstraint.options.map(o => `${o.min}-${o.max} ${o.suit}`).join(' OR ');
      console.log(`OR constraint failed: needs ${optionsStr}`);
      return false;
    }

    if (orConstraint.combinedMax !== undefined) {
      const suits = orConstraint.options.map(o => o.suit);
      const total = suits.reduce((sum, suit) => sum + distribution[suit], 0);
      if (total > orConstraint.combinedMax) {
        console.log(`OR combined max failed: ${suits.join('+')} has ${total}, max allowed ${orConstraint.combinedMax}`);
        return false;
      }
    }
  }

  const points = calculatePoints(cards);
  if (points < minPoints || points > maxPoints) {
    console.log(`Points constraint failed: has ${points}, needs ${minPoints}-${maxPoints}`);
    return false;
  }

  return true;
}

export function dealCardsWithConstraints(constraints: Constraints): Deal {
  console.log('dealCardsWithConstraints called with:', {
    northSuits: constraints.northSuits,
    northCombined: constraints.northCombined,
    southSuits: constraints.southSuits,
    southCombined: constraints.southCombined,
    eastSuits: constraints.eastSuits,
    eastCombined: constraints.eastCombined,
    westSuits: constraints.westSuits,
    westCombined: constraints.westCombined
  });

  const maxAttempts = 100000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = createFullDeck();
    const shuffled = shuffleDeck(deck);

    const northCards = shuffled.slice(0, 13);
    const eastCards = shuffled.slice(13, 26);
    const southCards = shuffled.slice(26, 39);
    const westCards = shuffled.slice(39, 52);

    const northMeetsConstraints = meetsConstraints(
      northCards,
      constraints.northSuits,
      constraints.northMin,
      constraints.northMax,
      constraints.northCombined,
      constraints.northOr || []
    );

    const southMeetsConstraints = meetsConstraints(
      southCards,
      constraints.southSuits,
      constraints.southMin,
      constraints.southMax,
      constraints.southCombined,
      constraints.southOr || []
    );

    const eastMeetsConstraints = meetsConstraints(
      eastCards,
      constraints.eastSuits,
      constraints.eastMin,
      constraints.eastMax,
      constraints.eastCombined,
      constraints.eastOr || []
    );

    const westMeetsConstraints = meetsConstraints(
      westCards,
      constraints.westSuits,
      constraints.westMin,
      constraints.westMax,
      constraints.westCombined,
      constraints.westOr || []
    );

    if (northMeetsConstraints && southMeetsConstraints && eastMeetsConstraints && westMeetsConstraints) {
      const northDist = getSuitDistribution(northCards);
      const southDist = getSuitDistribution(southCards);
      const eastDist = getSuitDistribution(eastCards);
      const westDist = getSuitDistribution(westCards);
      console.log('Valid deal found after', attempt + 1, 'attempts');
      console.log('North distribution:', northDist);
      console.log('South distribution:', southDist);
      console.log('East distribution:', eastDist);
      console.log('West distribution:', westDist);
      return {
        north: { cards: northCards, points: calculatePoints(northCards) },
        east: { cards: eastCards, points: calculatePoints(eastCards) },
        south: { cards: southCards, points: calculatePoints(southCards) },
        west: { cards: westCards, points: calculatePoints(westCards) },
      };
    }
  }

  throw new Error('Could not generate valid deal within maximum attempts');
}
