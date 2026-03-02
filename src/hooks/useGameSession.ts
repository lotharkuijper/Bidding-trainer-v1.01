import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Database } from '../database.types';

type GameSession = Database['public']['Tables']['game_sessions']['Row'];

export function useGameSession(sessionId: string | null) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!sessionId) return;

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      return;
    }

    if (data) {
      setSession(data);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchSession() {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setSession(data);
      }
      setLoading(false);
    }

    fetchSession();

    const channel = supabase
      .channel(`game_session_${sessionId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: sessionId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload.eventType);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newSession = payload.new as GameSession;
            setSession(newSession);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [sessionId]);

  return { session, loading, error, refreshSession };
}
