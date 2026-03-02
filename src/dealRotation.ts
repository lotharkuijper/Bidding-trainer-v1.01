import { Direction, Vulnerability } from './types';

export interface DealRotation {
  dealer: Direction;
  vulnerability: Vulnerability;
}

const ROTATION_CYCLE: DealRotation[] = [
  { dealer: 'north', vulnerability: 'none' },  // Deal 1
  { dealer: 'east', vulnerability: 'ns' },     // Deal 2
  { dealer: 'south', vulnerability: 'ew' },    // Deal 3
  { dealer: 'west', vulnerability: 'all' },    // Deal 4
  { dealer: 'north', vulnerability: 'ns' },    // Deal 5
  { dealer: 'east', vulnerability: 'ew' },     // Deal 6
  { dealer: 'south', vulnerability: 'all' },   // Deal 7
  { dealer: 'west', vulnerability: 'none' },   // Deal 8
  { dealer: 'north', vulnerability: 'ew' },    // Deal 9
  { dealer: 'east', vulnerability: 'all' },    // Deal 10
  { dealer: 'south', vulnerability: 'none' },  // Deal 11
  { dealer: 'west', vulnerability: 'ns' },     // Deal 12
  { dealer: 'north', vulnerability: 'all' },   // Deal 13
  { dealer: 'east', vulnerability: 'none' },   // Deal 14
  { dealer: 'south', vulnerability: 'ns' },    // Deal 15
  { dealer: 'west', vulnerability: 'ew' },     // Deal 16
];

export function getDealerAndVulnerability(dealNumber: number): DealRotation {
  if (dealNumber <= 0) {
    return ROTATION_CYCLE[0];
  }

  const index = (dealNumber - 1) % 16;
  return ROTATION_CYCLE[index];
}

export function getDealerAndVulnerabilityWithLocks(
  dealNumber: number,
  currentDealer: Direction,
  currentVulnerability: Vulnerability,
  lockDealer: boolean,
  lockVulnerability: boolean
): DealRotation {
  const standardRotation = getDealerAndVulnerability(dealNumber);

  return {
    dealer: lockDealer ? currentDealer : standardRotation.dealer,
    vulnerability: lockVulnerability ? currentVulnerability : standardRotation.vulnerability,
  };
}

export function getNextDealNumber(currentDealNumber: number): number {
  return currentDealNumber + 1;
}
