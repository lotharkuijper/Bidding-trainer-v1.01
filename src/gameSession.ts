import { supabase } from './supabaseClient';
import { Constraints, Deal, Direction, Vulnerability, BiddingState, Bid, BidPlayer, BidLevel, BidSuit } from './types';
import { getDealerAndVulnerability, getDealerAndVulnerabilityWithLocks, getNextDealNumber } from './dealRotation';

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createGameSession(
  playerName: string,
  constraints: Constraints
): Promise<{ success: boolean; joinCode?: string; error?: string }> {
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const joinCode = generateJoinCode();

    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        join_code: joinCode,
        host_player_name: playerName,
        south_player_name: playerName,
        constraints,
        status: 'waiting',
      })
      .select()
      .maybeSingle();

    if (data) {
      return { success: true, joinCode };
    }

    if (error && error.code !== '23505') {
      return { success: false, error: error.message };
    }

    attempts++;
  }

  return { success: false, error: 'Kon geen unieke join code genereren' };
}

export async function joinGameSession(
  joinCode: string,
  playerName: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const { data: session, error: fetchError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('join_code', joinCode.toUpperCase())
    .eq('status', 'waiting')
    .maybeSingle();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!session) {
    return { success: false, error: 'Sessie niet gevonden of al gestart' };
  }

  if (session.north_player_name) {
    return { success: false, error: 'Sessie is al vol' };
  }

  const { error: updateError } = await supabase
    .from('game_sessions')
    .update({
      north_player_name: playerName,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, sessionId: session.id };
}

export async function updateSessionSettings(
  sessionId: string,
  constraints: Constraints,
  dealer: Direction,
  vulnerability: Vulnerability,
  lockDealer?: boolean,
  lockVulnerability?: boolean,
  allowUndoBid?: boolean,
  allowOpponentBidding?: boolean
): Promise<{ success: boolean; error?: string; session?: any }> {
  const updateData: any = {
    constraints,
    dealer,
    vulnerability,
    updated_at: new Date().toISOString(),
  };

  if (lockDealer !== undefined) {
    updateData.lock_dealer = lockDealer;
  }
  if (lockVulnerability !== undefined) {
    updateData.lock_vulnerability = lockVulnerability;
  }
  if (allowUndoBid !== undefined) {
    updateData.allow_undo_bid = allowUndoBid;
  }
  if (allowOpponentBidding !== undefined) {
    updateData.allow_opponent_bidding = allowOpponentBidding;
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data };
}

export async function updateEWAlwaysPass(
  sessionId: string,
  ewAlwaysPass: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('game_sessions')
    .update({
      ew_always_pass: ewAlwaysPass,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateDeal(
  sessionId: string,
  deal: Deal | null,
  constraints: Constraints,
  dealer?: Direction,
  vulnerability?: Vulnerability
): Promise<{ success: boolean; error?: string; session?: any }> {
  const updateData: any = {
    constraints,
    updated_at: new Date().toISOString(),
  };

  if (deal !== undefined) {
    updateData.current_deal = deal;
  }

  if (dealer !== undefined) {
    updateData.dealer = dealer;
  }

  if (vulnerability !== undefined) {
    updateData.vulnerability = vulnerability;
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data };
}

export async function createNewDealWithRotation(
  sessionId: string,
  deal: Deal,
  constraints: Constraints,
  useAutoRotation: boolean = true
): Promise<{ success: boolean; error?: string; session?: any; dealNumber?: number }> {
  const { data: currentSession, error: fetchError } = await supabase
    .from('game_sessions')
    .select('deal_number, dealer, vulnerability, lock_dealer, lock_vulnerability')
    .eq('id', sessionId)
    .maybeSingle();

  if (fetchError || !currentSession) {
    return { success: false, error: 'Kon sessie niet ophalen' };
  }

  const currentDealNumber = currentSession.deal_number || 0;
  const newDealNumber = getNextDealNumber(currentDealNumber);

  let dealer: Direction;
  let vulnerability: Vulnerability;

  if (useAutoRotation) {
    const lockDealer = currentSession.lock_dealer || false;
    const lockVulnerability = currentSession.lock_vulnerability || false;

    const rotation = getDealerAndVulnerabilityWithLocks(
      newDealNumber,
      currentSession.dealer as Direction,
      currentSession.vulnerability as Vulnerability,
      lockDealer,
      lockVulnerability
    );
    dealer = rotation.dealer;
    vulnerability = rotation.vulnerability;
  } else {
    dealer = currentSession.dealer as Direction;
    vulnerability = currentSession.vulnerability as Vulnerability;
  }

  const updateData = {
    current_deal: deal,
    constraints,
    dealer,
    vulnerability,
    deal_number: newDealNumber,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('game_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data, dealNumber: newDealNumber };
}

export async function getGameSession(sessionId: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data };
}

export async function getGameSessionByJoinCode(joinCode: string) {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('join_code', joinCode.toUpperCase())
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data };
}

export function getNextBidder(currentBidder: BidPlayer): BidPlayer {
  const order: BidPlayer[] = ['north', 'east', 'south', 'west'];
  const currentIndex = order.indexOf(currentBidder);
  const nextIndex = (currentIndex + 1) % 4;
  return order[nextIndex];
}

export function getStartingBidder(dealer: Direction): BidPlayer {
  return dealer;
}

export function initializeBiddingState(dealer: Direction): BiddingState {
  const startingPlayer = getStartingBidder(dealer);

  return {
    bids: [],
    startingPlayer,
    currentBidder: startingPlayer,
    isComplete: false,
  };
}

export function getBidValue(level?: BidLevel, suit?: BidSuit): number {
  if (!level || !suit) return 0;

  const suitValues = {
    clubs: 1,
    diamonds: 2,
    hearts: 3,
    spades: 4,
    notrump: 5,
  };

  return level * 10 + suitValues[suit];
}

function getPartnership(player: BidPlayer): 'ns' | 'ew' {
  return player === 'north' || player === 'south' ? 'ns' : 'ew';
}

function isOpponent(player1: BidPlayer, player2: BidPlayer): boolean {
  return getPartnership(player1) !== getPartnership(player2);
}

export function canDouble(
  player: BidPlayer,
  biddingState: BiddingState
): boolean {
  const bids = biddingState.bids;
  if (bids.length === 0) return false;

  const lastRealBid = [...bids]
    .reverse()
    .find(bid => bid.bidType === 'bid' || bid.bidType === 'double');

  if (!lastRealBid) return false;

  if (lastRealBid.bidType === 'bid') {
    if (!isOpponent(player, lastRealBid.player)) return false;

    const myPartnership = getPartnership(player);
    const bidsAfterLastBid = bids.slice(bids.indexOf(lastRealBid) + 1);

    const partnerHasDoubled = bidsAfterLastBid.some(
      bid => getPartnership(bid.player) === myPartnership &&
             (bid.bidType === 'double' || bid.bidType === 'redouble')
    );

    return !partnerHasDoubled;
  }

  return false;
}

export function canRedouble(
  player: BidPlayer,
  biddingState: BiddingState
): boolean {
  const bids = biddingState.bids;
  if (bids.length === 0) return false;

  const lastDouble = [...bids]
    .reverse()
    .find(bid => bid.bidType === 'double');

  if (!lastDouble) return false;

  if (!isOpponent(player, lastDouble.player)) return false;

  const bidsAfterDouble = bids.slice(bids.indexOf(lastDouble) + 1);
  const hasNonPassAfterDouble = bidsAfterDouble.some(bid => bid.bidType !== 'pass');

  return !hasNonPassAfterDouble;
}

export function isValidBid(
  newBid: Bid,
  biddingState: BiddingState
): { valid: boolean; error?: string } {
  if (newBid.bidType === 'pass') {
    return { valid: true };
  }

  if (newBid.bidType === 'double') {
    if (!canDouble(newBid.player, biddingState)) {
      return { valid: false, error: 'Doublet is niet toegestaan' };
    }
    return { valid: true };
  }

  if (newBid.bidType === 'redouble') {
    if (!canRedouble(newBid.player, biddingState)) {
      return { valid: false, error: 'Redoublet is niet toegestaan' };
    }
    return { valid: true };
  }

  if (newBid.bidType === 'bid') {
    if (!newBid.level || !newBid.suit) {
      return { valid: false, error: 'Level en suit zijn verplicht voor een bod' };
    }

    const lastBid = [...biddingState.bids]
      .reverse()
      .find(bid => bid.bidType === 'bid');

    if (lastBid && lastBid.level && lastBid.suit) {
      const lastBidValue = getBidValue(lastBid.level, lastBid.suit);
      const newBidValue = getBidValue(newBid.level, newBid.suit);

      if (newBidValue <= lastBidValue) {
        return { valid: false, error: 'Bod moet hoger zijn dan het vorige bod' };
      }
    }
  }

  return { valid: true };
}

export async function startBidding(
  sessionId: string,
  dealer: Direction
): Promise<{ success: boolean; error?: string }> {
  const biddingState = initializeBiddingState(dealer);

  const { data, error } = await supabase
    .from('game_sessions')
    .update({
      bidding_state: biddingState,
      bidding_complete: false,
      current_bidder: biddingState.currentBidder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetBidding(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('game_sessions')
    .update({
      bidding_state: null,
      bidding_complete: false,
      current_bidder: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function placeAutomaticPass(
  sessionId: string,
  player: BidPlayer
): Promise<{ success: boolean; error?: string }> {
  const bid: Bid = {
    bidType: 'pass',
    player,
    timestamp: new Date().toISOString(),
  };

  return placeBid(sessionId, bid);
}

export async function placeBid(
  sessionId: string,
  bid: Bid
): Promise<{ success: boolean; error?: string }> {
  const { data: session, error: fetchError } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (fetchError || !session) {
    return { success: false, error: 'Sessie niet gevonden' };
  }

  const biddingState = session.bidding_state as BiddingState;

  if (!biddingState) {
    return { success: false, error: 'Bidding is nog niet gestart' };
  }

  if (biddingState.isComplete) {
    return { success: false, error: 'Bidding is al afgelopen' };
  }

  if (bid.player !== biddingState.currentBidder) {
    return { success: false, error: 'Het is niet jouw beurt' };
  }

  const validation = isValidBid(bid, biddingState);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const newBids = [...biddingState.bids, bid];

  let isComplete = false;
  if (bid.bidType === 'pass') {
    const hasRealBid = newBids.some(b => b.bidType === 'bid');

    if (hasRealBid) {
      if (newBids.length >= 3) {
        const lastThreeBids = newBids.slice(-3);
        if (lastThreeBids.every(b => b.bidType === 'pass')) {
          isComplete = true;
        }
      }
    } else {
      if (newBids.length >= 4) {
        const lastFourBids = newBids.slice(-4);
        if (lastFourBids.every(b => b.bidType === 'pass')) {
          isComplete = true;
        }
      }
    }
  }

  const nextBidder = isComplete ? biddingState.currentBidder : getNextBidder(biddingState.currentBidder);

  const updatedBiddingState: BiddingState = {
    ...biddingState,
    bids: newBids,
    currentBidder: nextBidder,
    isComplete,
  };

  const { error: updateError } = await supabase
    .from('game_sessions')
    .update({
      bidding_state: updatedBiddingState,
      bidding_complete: isComplete,
      current_bidder: nextBidder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function undoBid(
  sessionId: string,
  bidTimestamp: string,
  playerPosition: BidPlayer
): Promise<{ success: boolean; error?: string }> {
  const { data: session, error: fetchError } = await supabase
    .from('game_sessions')
    .select('bidding_state, allow_undo_bid')
    .eq('id', sessionId)
    .maybeSingle();

  if (fetchError || !session) {
    return { success: false, error: 'Sessie niet gevonden' };
  }

  if (!session.allow_undo_bid) {
    return { success: false, error: 'Bieding herstellen is niet toegestaan' };
  }

  const biddingState = session.bidding_state as BiddingState;

  if (!biddingState) {
    return { success: false, error: 'Bidding is nog niet gestart' };
  }

  if (biddingState.bids.length === 0) {
    return { success: false, error: 'Geen biedingen om ongedaan te maken' };
  }

  const bidIndex = biddingState.bids.findIndex(
    bid => bid.player === playerPosition && bid.timestamp === bidTimestamp
  );

  if (bidIndex === -1) {
    return { success: false, error: 'Bieding niet gevonden' };
  }

  const newBids = biddingState.bids.slice(0, bidIndex);
  const newCurrentBidder = playerPosition;

  const updatedBiddingState: BiddingState = {
    ...biddingState,
    bids: newBids,
    currentBidder: newCurrentBidder,
    isComplete: false,
  };

  const { error: updateError } = await supabase
    .from('game_sessions')
    .update({
      bidding_state: updatedBiddingState,
      bidding_complete: false,
      current_bidder: newCurrentBidder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function sendChatMessage(
  sessionId: string,
  playerName: string,
  playerPosition: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      player_name: playerName,
      player_position: playerPosition,
      message,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getChatMessages(sessionId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }

  return data || [];
}
