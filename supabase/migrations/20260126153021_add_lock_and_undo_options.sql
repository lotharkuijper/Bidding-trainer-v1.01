/*
  # Add lock options and undo bid setting

  1. Changes
    - Add `lock_dealer` column (boolean) - locks dealer for subsequent deals
    - Add `lock_vulnerability` column (boolean) - locks vulnerability for subsequent deals
    - Add `allow_undo_bid` column (boolean) - allows players to undo their last bid
    - Add `deal_number` column (integer) - tracks the current deal number
    
  2. Notes
    - All new columns default to false
    - These settings are controlled by the host
    - deal_number helps track progression through multiple deals
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'lock_dealer'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN lock_dealer boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'lock_vulnerability'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN lock_vulnerability boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'allow_undo_bid'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN allow_undo_bid boolean DEFAULT false;
  END IF;
END $$;