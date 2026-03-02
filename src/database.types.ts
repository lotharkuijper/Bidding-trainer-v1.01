import { Constraints, Deal, Direction, Vulnerability, BiddingState, BidPlayer } from './types';

export interface Database {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          id: string;
          join_code: string;
          host_player_name: string;
          north_player_name: string | null;
          south_player_name: string | null;
          constraints: Constraints;
          current_deal: Deal | null;
          dealer: Direction;
          vulnerability: Vulnerability;
          status: 'waiting' | 'active' | 'completed';
          bidding_state: BiddingState | null;
          bidding_complete: boolean;
          current_bidder: BidPlayer | null;
          lock_dealer: boolean;
          lock_vulnerability: boolean;
          allow_undo_bid: boolean;
          deal_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          join_code: string;
          host_player_name: string;
          north_player_name?: string | null;
          south_player_name?: string | null;
          constraints: Constraints;
          current_deal?: Deal | null;
          dealer?: Direction;
          vulnerability?: Vulnerability;
          status?: 'waiting' | 'active' | 'completed';
          bidding_state?: BiddingState | null;
          bidding_complete?: boolean;
          current_bidder?: BidPlayer | null;
          lock_dealer?: boolean;
          lock_vulnerability?: boolean;
          allow_undo_bid?: boolean;
          deal_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          join_code?: string;
          host_player_name?: string;
          north_player_name?: string | null;
          south_player_name?: string | null;
          constraints?: Constraints;
          current_deal?: Deal | null;
          dealer?: Direction;
          vulnerability?: Vulnerability;
          status?: 'waiting' | 'active' | 'completed';
          bidding_state?: BiddingState | null;
          bidding_complete?: boolean;
          current_bidder?: BidPlayer | null;
          lock_dealer?: boolean;
          lock_vulnerability?: boolean;
          allow_undo_bid?: boolean;
          deal_number?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
