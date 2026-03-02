import { useState, useEffect, useCallback } from 'react';
import { Constraints, Deal, Direction, Vulnerability, BiddingState, BidLevel, BidSuit, BidPlayer } from './types';
import { dealCardsWithConstraints } from './dealCards';
import { HandDisplay } from './components/HandDisplay';
import { ConfigPanel } from './components/ConfigPanel';
import { GameLobby } from './components/GameLobby';
import { VulnerabilityCompass } from './components/VulnerabilityCompass';
import { BiddingBox } from './components/BiddingBox';
import { BiddingHistory } from './components/BiddingHistory';
import { Chat } from './components/Chat';
import { ExportDeal } from './components/ExportDeal';
import { LanguageToggle } from './components/LanguageToggle';
import { AllHandsView } from './components/AllHandsView';
import { Spade, Users, LogOut, RefreshCw, RotateCcw, Eye } from 'lucide-react';
import { useGameSession } from './hooks/useGameSession';
import { updateDeal, updateSessionSettings, startBidding, placeBid, resetBidding, placeAutomaticPass, sendChatMessage, getChatMessages, createNewDealWithRotation, undoBid, updateEWAlwaysPass, canDouble, canRedouble } from './gameSession';
import { normalizeConstraints } from './constraintsUtils';
import { useLanguage } from './i18n/LanguageContext';

const DEFAULT_CONSTRAINTS: Constraints = {
  northMin: 12,
  northMax: 14,
  southMin: 12,
  southMax: 14,
  eastMin: 0,
  eastMax: 37,
  westMin: 0,
  westMax: 37,
  northSuits: {
    spades: { min: 0, max: 13 },
    hearts: { min: 0, max: 13 },
    diamonds: { min: 0, max: 13 },
    clubs: { min: 0, max: 13 },
  },
  southSuits: {
    spades: { min: 0, max: 13 },
    hearts: { min: 0, max: 13 },
    diamonds: { min: 0, max: 13 },
    clubs: { min: 0, max: 13 },
  },
  eastSuits: {
    spades: { min: 0, max: 13 },
    hearts: { min: 0, max: 13 },
    diamonds: { min: 0, max: 13 },
    clubs: { min: 0, max: 13 },
  },
  westSuits: {
    spades: { min: 0, max: 13 },
    hearts: { min: 0, max: 13 },
    diamonds: { min: 0, max: 13 },
    clubs: { min: 0, max: 13 },
  },
  northCombined: [],
  southCombined: [],
  eastCombined: [],
  westCombined: [],
  northOr: [],
  southOr: [],
  eastOr: [],
  westOr: [],
};

type PlayerRole = 'host' | 'guest';

interface ChatMessage {
  id: string;
  player_name: string;
  player_position: string;
  message: string;
  created_at: string;
}

function App() {
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<PlayerRole | null>(null);
  const [playerName, setPlayerName] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [lastBidByMe, setLastBidByMe] = useState<{ level: BidLevel; suit: BidSuit; timestamp: string } | null>(null);
  const [showAllHands, setShowAllHands] = useState(false);

  const { session, loading: sessionLoading, refreshSession } = useGameSession(sessionId);

  const constraints = session?.constraints ? normalizeConstraints(session.constraints) : DEFAULT_CONSTRAINTS;
  const deal = session?.current_deal || null;
  const dealer = (session?.dealer as Direction) || 'south';
  const vulnerability = (session?.vulnerability as Vulnerability) || 'none';
  const dealNumber = session?.deal_number || 0;
  const lockDealer = session?.lock_dealer || false;
  const lockVulnerability = session?.lock_vulnerability || false;
  const allowUndoBid = session?.allow_undo_bid || false;
  const allowOpponentBidding = session?.allow_opponent_bidding || false;
  const ewAlwaysPass = session?.ew_always_pass ?? true;
  const isHost = playerRole === 'host';
  const myHand = isHost ? deal?.south : deal?.north;
  const myPosition = (isHost ? 'south' : 'north') as BidPlayer;
  const myLabel = isHost ? `${t('game.south')} (${t('game.you')})` : `${t('game.north')} (${t('game.you')})`;
  const partnerName = isHost ? session?.north_player_name : session?.south_player_name;
  const partnerHand = isHost ? deal?.north : deal?.south;
  const partnerLabel = isHost ? `${t('game.north')} (${t('game.partner')})` : `${t('game.south')} (${t('game.partner')})`;
  const partnerPosition: BidPlayer = isHost ? 'north' : 'south';
  const biddingState = session?.bidding_state as BiddingState | null;
  const biddingComplete = session?.bidding_complete || false;
  const isMyTurn = biddingState?.currentBidder === myPosition;
  const isEWTurn = biddingState?.currentBidder === 'east' || biddingState?.currentBidder === 'west';
  const showEWBiddingBox = isHost && allowOpponentBidding && !ewAlwaysPass && isEWTurn;
  const lastBid = biddingState?.bids[biddingState.bids.length - 1];

  // Check if I just placed a bid and partner hasn't bid yet
  const canUndoMyBid = (() => {
    if (!allowUndoBid || !lastBidByMe || !biddingState) return false;

    // Find my bid in the bidding state
    const myBidIndex = biddingState.bids.findIndex(
      bid => bid.player === myPosition && bid.timestamp === lastBidByMe.timestamp
    );

    // If my bid is not found, I can't undo it
    if (myBidIndex === -1) return false;

    // Check if partner has bid after my bid
    const bidsAfterMine = biddingState.bids.slice(myBidIndex + 1);
    const partnerHasBid = bidsAfterMine.some(bid => bid.player === partnerPosition);

    // Can undo if partner hasn't bid yet
    return !partnerHasBid;
  })();

  // Reset lastBidByMe when partner bids or when bidding is complete
  useEffect(() => {
    if (!lastBidByMe) return;

    // If bidding is complete, reset
    if (biddingComplete) {
      setLastBidByMe(null);
      return;
    }

    // Check if partner has bid after my last bid
    if (biddingState && lastBidByMe.timestamp) {
      const myBidIndex = biddingState.bids.findIndex(
        bid => bid.player === myPosition && bid.timestamp === lastBidByMe.timestamp
      );

      if (myBidIndex !== -1) {
        // Check all bids after mine
        const bidsAfterMine = biddingState.bids.slice(myBidIndex + 1);
        const partnerHasBid = bidsAfterMine.some(bid => bid.player === partnerPosition);

        if (partnerHasBid) {
          setLastBidByMe(null);
          return;
        }
      }
    }

    // If my local bid doesn't match the last bid anymore, reset
    if (lastBid && lastBid.player === myPosition) {
      const bidMatches = lastBid.bidType === 'pass'
        ? (lastBidByMe.level === 0)
        : (lastBid.level === lastBidByMe.level && lastBid.suit === lastBidByMe.suit);

      if (!bidMatches) {
        setLastBidByMe(null);
      }
    }
  }, [lastBid, myPosition, biddingComplete, lastBidByMe, biddingState, partnerPosition]);

  const handleSessionCreated = (newSessionId: string, newJoinCode: string, name: string, role: PlayerRole) => {
    setSessionId(newSessionId);
    setJoinCode(newJoinCode);
    setPlayerName(name);
    setPlayerRole(role);
  };

  const handleSessionJoined = (newSessionId: string, name: string, role: PlayerRole) => {
    setSessionId(newSessionId);
    setPlayerName(name);
    setPlayerRole(role);
  };

  const handleDeal = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      // Reset local bid tracking state
      setLastBidByMe(null);

      // Reset ewAlwaysPass to false so host can bid for opponents again
      if (allowOpponentBidding) {
        await updateEWAlwaysPass(sessionId, false);
      }

      // First reset the bidding state
      await resetBidding(sessionId);

      // Then create and set new deal with automatic rotation
      const newDeal = dealCardsWithConstraints(constraints);
      const result = await createNewDealWithRotation(sessionId, newDeal, constraints, true);

      if (result.success && refreshSession) {
        await refreshSession();

        // Start fresh bidding after refresh with new dealer
        const newDealer = result.session?.dealer as Direction;
        const biddingResult = await startBidding(sessionId, newDealer);
        if (biddingResult.success && refreshSession) {
          await refreshSession();
        }

        // Scroll to top to show the cards
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error in handleDeal:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, constraints, refreshSession, allowOpponentBidding]);

  const handleSettingsChangeAndDeal = useCallback(async (
    newConstraints: Constraints,
    newDealer: Direction,
    newVulnerability: Vulnerability,
    newLockDealer?: boolean,
    newLockVulnerability?: boolean,
    newAllowUndoBid?: boolean,
    newAllowOpponentBidding?: boolean
  ) => {
    if (!sessionId) return;

    setLoading(true);
    try {
      // Reset local bid tracking state
      setLastBidByMe(null);

      const result = await updateSessionSettings(
        sessionId,
        newConstraints,
        newDealer,
        newVulnerability,
        newLockDealer,
        newLockVulnerability,
        newAllowUndoBid,
        newAllowOpponentBidding
      );

      if (result.success && refreshSession) {
        await refreshSession();

        const newDeal = dealCardsWithConstraints(newConstraints);
        const dealResult = await updateDeal(sessionId, newDeal, newConstraints, newDealer, newVulnerability);

        if (dealResult.success && refreshSession) {
          await refreshSession();
        }
      }
    } catch (error) {
      console.error('Error in handleSettingsChangeAndDeal:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, refreshSession]);


  const handleLeaveSession = () => {
    setSessionId(null);
    setPlayerRole(null);
    setPlayerName('');
    setJoinCode('');
    setLastBidByMe(null);
  };

  const handlePlaceBid = useCallback(async (level: BidLevel, suit: BidSuit) => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const bid = {
        level,
        suit,
        bidType: 'bid' as const,
        player: myPosition,
        timestamp,
      };

      // Store this bid locally so we can track it
      setLastBidByMe({ level, suit, timestamp });

      const result = await placeBid(sessionId, bid);

      if (result.success && refreshSession) {
        await refreshSession();
      } else if (result.error) {
        alert(result.error);
        // If placing bid failed, clear the local state
        setLastBidByMe(null);
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      setLastBidByMe(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, myPosition, refreshSession]);

  const handlePass = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const bid = {
        bidType: 'pass' as const,
        player: myPosition,
        timestamp,
      };

      // For pass, use a special marker so we can track it
      setLastBidByMe({ level: 0 as BidLevel, suit: 'clubs' as BidSuit, timestamp });

      const result = await placeBid(sessionId, bid);

      if (result.success && refreshSession) {
        await refreshSession();
      } else if (result.error) {
        alert(result.error);
        setLastBidByMe(null);
      }
    } catch (error) {
      console.error('Error passing:', error);
      setLastBidByMe(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, myPosition, refreshSession]);

  const handleDouble = useCallback(async () => {
    if (!sessionId || !biddingState) return;

    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const bid = {
        bidType: 'double' as const,
        player: isMyTurn ? myPosition : biddingState.currentBidder,
        timestamp,
      };

      const result = await placeBid(sessionId, bid);

      if (result.success && refreshSession) {
        await refreshSession();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error placing double:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, biddingState, isMyTurn, myPosition, refreshSession]);

  const handleRedouble = useCallback(async () => {
    if (!sessionId || !biddingState) return;

    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const bid = {
        bidType: 'redouble' as const,
        player: isMyTurn ? myPosition : biddingState.currentBidder,
        timestamp,
      };

      const result = await placeBid(sessionId, bid);

      if (result.success && refreshSession) {
        await refreshSession();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error placing redouble:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, biddingState, isMyTurn, myPosition, refreshSession]);

  const handleEWAlwaysPass = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const result = await updateEWAlwaysPass(sessionId, true);

      if (result.success && refreshSession) {
        await refreshSession();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error setting EW always pass:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, refreshSession]);

  const handleEWBid = useCallback(async (level: BidLevel, suit: BidSuit) => {
    if (!sessionId || !biddingState) return;

    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const bid = {
        level,
        suit,
        bidType: 'bid' as const,
        player: biddingState.currentBidder,
        timestamp,
      };

      const result = await placeBid(sessionId, bid);

      if (result.success && refreshSession) {
        await refreshSession();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error placing EW bid:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, biddingState, refreshSession]);

  const handleEWPass = useCallback(async () => {
    if (!sessionId || !biddingState) return;

    setLoading(true);
    try {
      const timestamp = new Date().toISOString();
      const bid = {
        bidType: 'pass' as const,
        player: biddingState.currentBidder,
        timestamp,
      };

      const result = await placeBid(sessionId, bid);

      if (result.success && refreshSession) {
        await refreshSession();
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error placing EW pass:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, biddingState, refreshSession]);

  const handleUndoBid = useCallback(async () => {
    if (!sessionId || !lastBidByMe) return;

    setLoading(true);
    try {
      const result = await undoBid(sessionId, lastBidByMe.timestamp, myPosition);

      if (result.success) {
        // Clear the local bid state after successful undo
        setLastBidByMe(null);
        if (refreshSession) {
          await refreshSession();
        }
      } else if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error undoing bid:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, lastBidByMe, myPosition, refreshSession]);

  const handleNewDeal = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      // Reset local bid tracking state
      setLastBidByMe(null);

      // Reset ewAlwaysPass to false so host can bid for opponents again
      if (allowOpponentBidding) {
        await updateEWAlwaysPass(sessionId, false);
      }

      // First reset the bidding state
      await resetBidding(sessionId);

      // Then create and set new deal with automatic rotation
      const newDeal = dealCardsWithConstraints(constraints);
      const result = await createNewDealWithRotation(sessionId, newDeal, constraints, true);

      if (result.success && refreshSession) {
        await refreshSession();

        // Start fresh bidding after refresh with new dealer
        const newDealer = result.session?.dealer as Direction;
        const biddingResult = await startBidding(sessionId, newDealer);
        if (biddingResult.success && refreshSession) {
          await refreshSession();
        }

        // Scroll to top to show the cards
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error creating new deal:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, constraints, refreshSession, allowOpponentBidding]);

  // Removed automatic dealing on session start
  // Host must explicitly click "Opnieuw Delen" to deal cards

  // Extra safeguard: if partner joined and there's a deal but myHand is missing, refresh
  useEffect(() => {
    if (!isHost && session && deal && !myHand && !loading) {
      if (refreshSession) {
        refreshSession();
      }
    }
  }, [isHost, session, deal, myHand, loading, refreshSession]);

  useEffect(() => {
    const initBidding = async () => {
      if (sessionId && deal && !biddingState && !loading && isHost) {
        const result = await startBidding(sessionId, dealer);
        if (result.success && refreshSession) {
          await refreshSession();
        }
      }
    };

    initBidding();
  }, [sessionId, deal, biddingState, dealer, loading, refreshSession, isHost]);

  // Polling mechanism to ensure both players stay in sync
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    // Poll every second to ensure clients stay synced
    const pollInterval = setInterval(() => {
      if (refreshSession) {
        refreshSession();
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId, refreshSession]);

  // Fetch chat messages periodically
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const fetchChatMessages = async () => {
      const messages = await getChatMessages(sessionId);
      setChatMessages(messages);
    };

    fetchChatMessages();

    const chatPollInterval = setInterval(fetchChatMessages, 2000);

    return () => {
      clearInterval(chatPollInterval);
    };
  }, [sessionId]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!sessionId) return;

    const result = await sendChatMessage(sessionId, playerName, myPosition, message);
    if (result.success) {
      const messages = await getChatMessages(sessionId);
      setChatMessages(messages);
    } else if (result.error) {
      alert(`${t('chat.errorSending')}: ${result.error}`);
    }
  }, [sessionId, playerName, myPosition]);

  // Automatic passing for East and West (only when ewAlwaysPass is true)
  useEffect(() => {
    const handleAutomaticPass = async () => {
      if (!sessionId || !biddingState || biddingComplete || loading) {
        return;
      }

      const currentBidder = biddingState.currentBidder;

      // Only automatically pass if ewAlwaysPass is true
      if ((currentBidder === 'east' || currentBidder === 'west') && isHost && ewAlwaysPass) {
        await placeAutomaticPass(sessionId, currentBidder);
        if (refreshSession) {
          await refreshSession();
        }
      }
    };

    handleAutomaticPass();
  }, [sessionId, biddingState, biddingComplete, loading, refreshSession, isHost, ewAlwaysPass]);

  if (!sessionId) {
    return (
      <GameLobby
        onSessionCreated={handleSessionCreated}
        onSessionJoined={handleSessionJoined}
        defaultConstraints={DEFAULT_CONSTRAINTS}
      />
    );
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="text-white mt-4 text-lg">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-4 md:py-8 px-2 md:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4 md:mb-6">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
            <Spade size={24} className="text-white md:w-10 md:h-10" />
            <h1 className="text-xl md:text-4xl font-bold text-white">{t('app.title')}</h1>
            <Spade size={24} className="text-white md:w-10 md:h-10" />
          </div>
          <div className="flex justify-center mt-3">
            <LanguageToggle />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                <div>
                  <p className="text-xs md:text-sm text-gray-600">{t('game.players')}</p>
                  <p className="text-sm md:text-base font-semibold text-gray-900">
                    {session?.south_player_name} & {session?.north_player_name || t('game.waiting')}
                  </p>
                </div>
              </div>
              {isHost && joinCode && (
                <div className="md:ml-6">
                  <p className="text-xs md:text-sm text-gray-600">Join Code</p>
                  <p className="font-bold text-blue-600 text-base md:text-lg tracking-wider">{joinCode}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
              {deal && dealNumber > 0 && (
                <div className="flex flex-col items-center">
                  <p className="text-xs text-gray-600 mb-1">{t('game.dealNumber')}</p>
                  <div className="bg-blue-100 text-blue-900 font-bold px-3 py-1.5 rounded-lg text-lg">
                    #{dealNumber}
                  </div>
                </div>
              )}
              {deal && (
                <div className="flex flex-col items-center">
                  <p className="text-xs text-gray-600 mb-1">{t('game.vulnerability')}</p>
                  <VulnerabilityCompass vulnerability={vulnerability} dealer={dealer} />
                </div>
              )}
              <button
                onClick={handleLeaveSession}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm md:text-base font-semibold rounded-lg hover:bg-red-700 transition-colors w-full md:w-auto min-h-[44px]"
              >
                <LogOut size={18} />
                {t('game.leave')}
              </button>
            </div>
          </div>
        </div>

        {isHost && (
          <ConfigPanel
            constraints={constraints}
            dealer={dealer}
            vulnerability={vulnerability}
            lockDealer={lockDealer}
            lockVulnerability={lockVulnerability}
            allowUndoBid={allowUndoBid}
            allowOpponentBidding={allowOpponentBidding}
            onSettingsChangeAndDeal={handleSettingsChangeAndDeal}
            onDeal={handleDeal}
          />
        )}

        {!isHost && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 mb-4 md:mb-6">
            <p className="text-blue-800 text-center text-sm md:text-base">
              <strong>{session?.south_player_name}</strong> {t('game.hostDetermines')}
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8 md:py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-white border-t-transparent"></div>
            <p className="text-white mt-4 text-base md:text-lg">{t('app.busy')}</p>
          </div>
        )}

        {!loading && deal && biddingState && !biddingComplete && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl shadow-2xl p-4 md:p-6">
              <div className="text-center">
                <h2 className="text-xl md:text-3xl font-bold text-white mb-2">
                  {isMyTurn ? t('bidding.yourTurn') : `${biddingState.currentBidder === 'north' ? (session?.north_player_name || t('game.north')) : (session?.south_player_name || t('game.south'))} ${t('bidding.isBidding')}`}
                </h2>
                {!isMyTurn && (
                  <p className="text-blue-100 text-sm md:text-lg">{t('bidding.waitForPartner')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div>
                <HandDisplay hand={myHand!} label={myLabel} position={myPosition} />
              </div>

              <div>
                <BiddingHistory biddingState={biddingState} dealer={dealer} myPosition={myPosition} />
              </div>
            </div>

            {isMyTurn && (
              <BiddingBox
                biddingState={biddingState}
                onBid={handlePlaceBid}
                onPass={handlePass}
                onDouble={allowOpponentBidding && biddingState && canDouble(myPosition, biddingState) ? handleDouble : undefined}
                onRedouble={allowOpponentBidding && biddingState && canRedouble(myPosition, biddingState) ? handleRedouble : undefined}
                allowDouble={allowOpponentBidding && biddingState ? canDouble(myPosition, biddingState) : false}
                allowRedouble={allowOpponentBidding && biddingState ? canRedouble(myPosition, biddingState) : false}
                isOpponentBidding={false}
              />
            )}

            {showEWBiddingBox && biddingState && (
              <div className="space-y-4">
                <div className="bg-orange-100 border-2 border-orange-400 rounded-xl p-4 text-center">
                  <h3 className="text-lg font-bold text-orange-900 mb-2">
                    {t('bidding.biddingForEW')} {biddingState.currentBidder === 'east' ? t('game.east') : t('game.west')}
                  </h3>
                  <p className="text-sm text-orange-800">
                    {t('bidding.youAreBiddingForOpponent')}
                  </p>
                </div>
                <BiddingBox
                  biddingState={biddingState}
                  onBid={handleEWBid}
                  onPass={handleEWPass}
                  onDouble={canDouble(biddingState.currentBidder, biddingState) ? handleDouble : undefined}
                  onRedouble={canRedouble(biddingState.currentBidder, biddingState) ? handleRedouble : undefined}
                  allowDouble={canDouble(biddingState.currentBidder, biddingState)}
                  allowRedouble={canRedouble(biddingState.currentBidder, biddingState)}
                  isOpponentBidding={true}
                  onAlwaysPass={handleEWAlwaysPass}
                />
              </div>
            )}

            {!isMyTurn && !showEWBiddingBox && isEWTurn && isHost && (
              <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 text-center">
                <p className="text-gray-700 text-sm md:text-base">
                  {biddingState?.currentBidder === 'east' ? t('game.east') : t('game.west')} {t('bidding.ewAutomaticPass')}
                </p>
              </div>
            )}

            {!isMyTurn && canUndoMyBid && (
              <div className="flex justify-center">
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 max-w-md">
                  <p className="text-xs text-orange-800 text-center mb-2">
                    {t('bidding.mistakeBid')}
                  </p>
                  <button
                    onClick={handleUndoBid}
                    className="w-full py-2 px-4 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    <RotateCcw size={16} />
                    {t('bidding.undoBid')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Chat
                sessionId={sessionId!}
                playerName={playerName}
                playerPosition={myPosition}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        )}

        {!loading && biddingComplete && myHand && partnerHand && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-2xl p-4 md:p-6">
              <div className="text-center">
                <h2 className="text-xl md:text-3xl font-bold text-white mb-2">
                  {t('bidding.biddingComplete')}
                </h2>
                <p className="text-green-100 text-sm md:text-lg">
                  {t('bidding.reviewHands')}
                </p>
              </div>
            </div>

            {biddingState && (
              <BiddingHistory biddingState={biddingState} dealer={dealer} myPosition={myPosition} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <HandDisplay hand={myHand} label={myLabel} position={myPosition} />
              <HandDisplay hand={partnerHand} label={partnerLabel} position={myPosition === 'south' ? 'north' : 'south'} />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowAllHands(true)}
                className="inline-flex items-center justify-center gap-2 px-5 md:px-6 py-3 bg-green-600 text-white font-bold text-base md:text-lg rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl min-h-[44px] w-full md:w-auto"
              >
                <Eye size={20} />
                {t('allHands.showAll')}
              </button>
              {biddingState && (
                <ExportDeal
                  deal={deal}
                  biddingState={biddingState}
                  dealer={dealer}
                  vulnerability={vulnerability}
                  dealNumber={dealNumber}
                />
              )}
              {isHost && (
                <button
                  onClick={handleNewDeal}
                  className="inline-flex items-center justify-center gap-2 px-5 md:px-6 py-3 bg-blue-600 text-white font-bold text-base md:text-lg rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl min-h-[44px] w-full md:w-auto"
                >
                  <RefreshCw size={20} />
                  {t('bidding.newDeal')}
                </button>
              )}
            </div>

            {showAllHands && (
              <AllHandsView deal={deal} onClose={() => setShowAllHands(false)} />
            )}

            {!isHost && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4 text-center">
                <p className="text-blue-800 text-sm md:text-base">
                  {t('bidding.waitForNewDeal')} <strong>{session?.south_player_name}</strong> {t('bidding.toStartNewDeal')}
                </p>
              </div>
            )}

            <div className="mt-6">
              <Chat
                sessionId={sessionId!}
                playerName={playerName}
                playerPosition={myPosition}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        )}

        {!myHand && !loading && !isHost && (
          <div className="text-center text-white py-8 md:py-12">
            <p className="text-base md:text-lg px-4">{t('game.waitingForDeal')} {session?.south_player_name} {t('game.toDealCards')}</p>
          </div>
        )}

        {!partnerName && isHost && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-6 mt-4 md:mt-6">
            <p className="text-yellow-800 text-center text-base md:text-lg">
              <strong>{t('game.waitingForPartner')}</strong>
              <br />
              <span className="text-sm">{t('game.shareJoinCode')} <strong className="text-lg md:text-xl">{joinCode}</strong> {t('game.withYourPartner')}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
