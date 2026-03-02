import { useState } from 'react';
import { Users, Copy, Check } from 'lucide-react';
import { createGameSession, joinGameSession } from '../gameSession';
import { Constraints } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageToggle } from './LanguageToggle';

interface GameLobbyProps {
  onSessionCreated: (sessionId: string, joinCode: string, playerName: string, role: 'host') => void;
  onSessionJoined: (sessionId: string, playerName: string, role: 'guest') => void;
  defaultConstraints: Constraints;
}

export function GameLobby({ onSessionCreated, onSessionJoined, defaultConstraints }: GameLobbyProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [createdJoinCode, setCreatedJoinCode] = useState<string | null>(null);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError(t('lobby.enterName'));
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createGameSession(playerName.trim(), defaultConstraints);

    if (result.success && result.joinCode) {
      setCreatedJoinCode(result.joinCode);
    } else {
      setError(result.error || t('lobby.couldNotCreate'));
      setLoading(false);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError(t('lobby.enterName'));
      return;
    }
    if (!joinCode.trim()) {
      setError(t('lobby.enterJoinCode'));
      return;
    }

    setLoading(true);
    setError(null);

    const result = await joinGameSession(joinCode.trim(), playerName.trim());

    if (result.success && result.sessionId) {
      onSessionJoined(result.sessionId, playerName.trim(), 'guest');
    } else {
      setError(result.error || t('lobby.couldNotJoin'));
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (createdJoinCode) {
      navigator.clipboard.writeText(createdJoinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleWaitingRoomContinue = async () => {
    if (!createdJoinCode) return;

    const { getGameSessionByJoinCode } = await import('../gameSession');
    const result = await getGameSessionByJoinCode(createdJoinCode);

    if (result.success && result.session) {
      onSessionCreated(result.session.id, createdJoinCode, playerName.trim(), 'host');
    }
  };

  if (createdJoinCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="absolute top-4 right-4">
            <LanguageToggle />
          </div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('lobby.sessionCreated')}
            </h2>
            <p className="text-gray-600">
              {t('lobby.shareCode')}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2 text-center">{t('lobby.joinCode')}</p>
            <div className="flex items-center justify-center gap-3">
              <div className="text-4xl font-bold text-blue-600 tracking-widest">
                {createdJoinCode}
              </div>
              <button
                onClick={copyJoinCode}
                className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
                title={t('lobby.copyCode')}
              >
                {copiedCode ? (
                  <Check className="text-green-600" size={24} />
                ) : (
                  <Copy className="text-blue-600" size={24} />
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              {t('lobby.notePartner')}
            </p>
          </div>

          <button
            onClick={handleWaitingRoomContinue}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            {t('lobby.continueToGame')}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
          <div className="absolute top-4 right-4">
            <LanguageToggle />
          </div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-blue-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('lobby.title')}
            </h1>
            <p className="text-gray-600">
              {t('lobby.subtitle')}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              {t('lobby.createSession')}
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              {t('lobby.joinWithCode')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
          <div className="absolute top-4 right-4">
            <LanguageToggle />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {t('lobby.createTitle')}
          </h2>

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('lobby.yourName')}
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={t('lobby.namePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('select');
                  setError(null);
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                {t('lobby.back')}
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                disabled={loading}
              >
                {loading ? t('lobby.creating') : t('lobby.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          {t('lobby.joinTitle')}
        </h2>

        <form onSubmit={handleJoinSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('lobby.yourName')}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t('lobby.namePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('lobby.joinCode')}
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={t('lobby.joinCodePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase tracking-widest text-center text-xl font-semibold"
              maxLength={6}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setMode('select');
                setError(null);
              }}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              disabled={loading}
            >
              {t('lobby.back')}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('lobby.joining') : t('lobby.join')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
