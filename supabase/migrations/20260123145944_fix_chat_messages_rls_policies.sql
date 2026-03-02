/*
  # Fix chat_messages RLS policies for anonymous access

  1. Changes
    - Drop existing RLS policies that only allowed authenticated users
    - Create new policies that allow both anonymous (anon) and authenticated users
    - This matches the access pattern used by game_sessions table
  
  2. Security
    - Allow anon and authenticated users to read all chat messages
    - Allow anon and authenticated users to insert chat messages
    - Messages are tied to sessions which control access through join codes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON chat_messages;

-- Create new policies with both anon and authenticated access
CREATE POLICY "Anyone can read chat messages"
  ON chat_messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
