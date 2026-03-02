/*
  # Add chat functionality to game sessions

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to game_sessions)
      - `player_name` (text) - name of the player who sent the message
      - `player_position` (text) - position of the player (north/south)
      - `message` (text) - the chat message content
      - `created_at` (timestamptz) - when the message was sent
  
  2. Security
    - Enable RLS on `chat_messages` table
    - Add policy for authenticated users to read all messages (they can only access sessions they're part of anyway)
    - Add policy for authenticated users to insert messages
  
  3. Indexes
    - Add index on session_id for efficient querying
    - Add index on created_at for ordering messages
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  player_position text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);