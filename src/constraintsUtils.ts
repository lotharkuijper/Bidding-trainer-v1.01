import { Constraints } from './types';

export function normalizeConstraints(constraints: any): Constraints {
  return {
    northMin: constraints.northMin ?? 0,
    northMax: constraints.northMax ?? 37,
    southMin: constraints.southMin ?? 0,
    southMax: constraints.southMax ?? 37,
    eastMin: constraints.eastMin ?? 0,
    eastMax: constraints.eastMax ?? 37,
    westMin: constraints.westMin ?? 0,
    westMax: constraints.westMax ?? 37,
    northSuits: constraints.northSuits ?? {
      spades: { min: 0, max: 13 },
      hearts: { min: 0, max: 13 },
      diamonds: { min: 0, max: 13 },
      clubs: { min: 0, max: 13 },
    },
    southSuits: constraints.southSuits ?? {
      spades: { min: 0, max: 13 },
      hearts: { min: 0, max: 13 },
      diamonds: { min: 0, max: 13 },
      clubs: { min: 0, max: 13 },
    },
    eastSuits: constraints.eastSuits ?? {
      spades: { min: 0, max: 13 },
      hearts: { min: 0, max: 13 },
      diamonds: { min: 0, max: 13 },
      clubs: { min: 0, max: 13 },
    },
    westSuits: constraints.westSuits ?? {
      spades: { min: 0, max: 13 },
      hearts: { min: 0, max: 13 },
      diamonds: { min: 0, max: 13 },
      clubs: { min: 0, max: 13 },
    },
    northCombined: constraints.northCombined ?? [],
    southCombined: constraints.southCombined ?? [],
    eastCombined: constraints.eastCombined ?? [],
    westCombined: constraints.westCombined ?? [],
    northOr: constraints.northOr ?? [],
    southOr: constraints.southOr ?? [],
    eastOr: constraints.eastOr ?? [],
    westOr: constraints.westOr ?? [],
  };
}
