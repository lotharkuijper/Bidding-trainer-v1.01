/*
  # Opponent Bidding Options

  1. Changes
    - Add `allow_opponent_bidding` column to `game_sessions` table
      - Boolean field to enable/disable bidding for opponents (East/West)
      - Defaults to false (disabled)
    
    - Add `ew_always_pass` column to `game_sessions` table
      - Boolean field to indicate if East/West should always pass automatically
      - Defaults to true (automatic passing enabled)
  
  2. Security
    - No RLS changes needed as these columns use existing table policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'allow_opponent_bidding'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN allow_opponent_bidding boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions' AND column_name = 'ew_always_pass'
  ) THEN
    ALTER TABLE game_sessions ADD COLUMN ew_always_pass boolean DEFAULT true;
  END IF;
END $$;
