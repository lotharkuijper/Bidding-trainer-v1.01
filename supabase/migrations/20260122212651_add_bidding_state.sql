/*
  # Add bidding functionality to game sessions

  1. Changes
    - Add `bidding_state` column (jsonb) to store the complete bidding history and state
    - Add `bidding_complete` column (boolean) to track if bidding phase is finished
    - Add `current_bidder` column (text) to track whose turn it is to bid
    
  2. Structure of bidding_state
    - bids: array of bid objects with { level, suit, bidType, player, timestamp }
    - startingPlayer: the player who bids first (dealer + 1 clockwise)
    
  3. Notes
    - bidding_state will be null until bidding starts
    - bidding_complete defaults to false
    - current_bidder tracks 'north' or 'south'
*/

DO $$
BEGIN
  -- Add bidding_state column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'bidding_state'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN bidding_state jsonb;
  END IF;

  -- Add bidding_complete column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'bidding_complete'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN bidding_complete boolean DEFAULT false;
  END IF;

  -- Add current_bidder column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'current_bidder'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN current_bidder text;
  END IF;
END $$;