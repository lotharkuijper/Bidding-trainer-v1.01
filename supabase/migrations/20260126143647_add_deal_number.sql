/*
  # Add deal number tracking

  1. Changes
    - Add `deal_number` column to `game_sessions` table
      - Tracks which deal number the session is on (1, 2, 3, etc.)
      - Defaults to 0 (no deals yet)
      - Used to automatically determine dealer and vulnerability

  2. Notes
    - Deal numbers follow bridge rubber bridge/duplicate conventions
    - Dealer and vulnerability rotate according to standard 16-deal cycle
    - Deal number increments each time a new deal is created
*/

-- Add deal_number column to game_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'deal_number'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN deal_number integer DEFAULT 0;
  END IF;
END $$;