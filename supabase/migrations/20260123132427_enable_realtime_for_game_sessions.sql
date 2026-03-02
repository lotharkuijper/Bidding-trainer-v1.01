/*
  # Enable Realtime for game_sessions

  This migration enables Supabase Realtime for the game_sessions table.
  This allows clients to receive real-time updates when session data changes.

  1. Changes
    - Add game_sessions table to supabase_realtime publication
  
  2. Notes
    - This enables real-time broadcasting of INSERT, UPDATE, and DELETE operations
    - Clients can now subscribe to changes using Supabase's realtime functionality
*/

-- Add game_sessions to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
