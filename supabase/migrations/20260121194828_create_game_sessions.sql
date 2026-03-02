/*
  # Create game sessions table for multiplayer bridge practice

  1. New Tables
    - `game_sessions`
      - `id` (uuid, primary key)
      - `join_code` (text, unique) - 6-character code for joining
      - `host_player_name` (text) - Name of player who created session
      - `north_player_name` (text, nullable) - Name of north player
      - `south_player_name` (text, nullable) - Name of south player
      - `constraints` (jsonb) - Current game constraints
      - `current_deal` (jsonb, nullable) - Current card deal
      - `status` (text) - Game status: 'waiting', 'active', 'completed'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `game_sessions` table
    - Allow anyone to read sessions (for joining)
    - Allow anyone to create sessions
    - Allow anyone to update sessions (for joining and dealing)

  3. Notes
    - Using simple access control without auth for now
    - Join codes are 6-character alphanumeric codes
    - Real-time updates will sync changes to all players
*/

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  join_code text UNIQUE NOT NULL,
  host_player_name text NOT NULL,
  north_player_name text,
  south_player_name text,
  constraints jsonb NOT NULL,
  current_deal jsonb,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game sessions"
  ON game_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create game sessions"
  ON game_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update game sessions"
  ON game_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_game_sessions_join_code ON game_sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at DESC);
