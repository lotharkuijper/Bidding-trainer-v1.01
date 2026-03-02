import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, GripHorizontal } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ChatMessage {
  id: string;
  player_name: string;
  player_position: string;
  message: string;
  created_at: string;
}

interface ChatProps {
  sessionId: string;
  playerName: string;
  playerPosition: string;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
}

const CARD_SYMBOLS: { [key: string]: string } = {
  '!C': '♣',
  '!K': '♣',
  '!D': '♦',
  '!R': '♦',
  '!H': '♥',
  '!S': '♠',
  '!SA': 'SA',
  '!P': 'Pas',
  '!Pas': 'Pas',
  '!X': 'X',
  '!XX': 'XX',
};

const SYMBOL_COLORS: { [key: string]: string } = {
  '♣': 'text-gray-900 font-black text-xl',
  '♦': 'text-red-600 text-xl',
  '♥': 'text-red-600 text-xl',
  '♠': 'text-gray-900 text-xl',
  'SA': 'text-blue-900 font-bold',
  'Pas': 'text-gray-600',
  'X': 'text-orange-600',
  'XX': 'text-red-700',
};

function formatMessageWithSymbols(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Pattern matches:
  // - Combined bids: !1C, !2H, !3SA, !7S, etc. (![1-7](C|K|D|R|H|S|SA))
  // - Special bids: !XX, !X, !Pas, !P, !SA
  // - Suit symbols: !C, !K, !D, !R, !H, !S
  // - Levels: !1-!7
  const pattern = /!([1-7])(C|K|D|R|H|S|SA)|!(XX|Pas|P|X|SA|C|K|D|R|H|S|[1-7])/gi;
  let match;
  let lastIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.substring(lastIndex, match.index)}</span>
      );
    }

    // Determine what was matched
    if (match[1] && match[2]) {
      // Combined bid like !1C, !2H, !3SA
      const level = match[1];
      const suitCode = match[2].toUpperCase();
      const suitKey = `!${suitCode}`;
      const symbol = CARD_SYMBOLS[suitKey] || suitCode;
      const colorClass = SYMBOL_COLORS[symbol] || 'text-gray-900';

      parts.push(
        <span key={key++} className="font-bold text-lg">
          <span className="text-gray-900">{level}</span>
          <span className={colorClass}>{symbol}</span>
        </span>
      );
    } else if (match[3]) {
      // Single symbol or bid
      const code = match[3].toUpperCase();
      const matchKey = `!${code}`;
      const symbol = CARD_SYMBOLS[matchKey] || code;
      const colorClass = SYMBOL_COLORS[symbol] || 'text-gray-900';

      // Check if it's a level number (1-7)
      if (/^[1-7]$/.test(code)) {
        parts.push(
          <span key={key++} className="font-bold text-lg text-gray-900">
            {code}
          </span>
        );
      } else {
        parts.push(
          <span key={key++} className={`font-bold text-lg ${colorClass}`}>
            {symbol}
          </span>
        );
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
}

export function Chat({ playerName, playerPosition, messages, onSendMessage }: ChatProps) {
  const { t } = useLanguage();
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatHeight, setChatHeight] = useState(() => {
    const saved = localStorage.getItem('chatHeight');
    const isMobile = window.innerWidth < 768;
    return saved ? parseInt(saved, 10) : (isMobile ? 250 : 300);
  });
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const previousMessageCount = useRef<number>(messages.length);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create audio context on first use
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Always scroll to bottom when messages change
    if (messages.length > previousMessageCount.current) {
      // Check if the new message is from another player
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.player_position !== playerPosition) {
        playNotificationSound();
      }

      // Always scroll to bottom with new messages
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
    previousMessageCount.current = messages.length;
  }, [messages, playerPosition]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 100);
  }, []);

  useEffect(() => {
    localStorage.setItem('chatHeight', chatHeight.toString());
  }, [chatHeight]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = chatHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = resizeStartY.current - e.clientY;
      const newHeight = Math.max(200, Math.min(800, resizeStartHeight.current + deltaY));
      setChatHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const messageToSend = inputMessage;
    setIsSending(true);
    try {
      await onSendMessage(messageToSend);
      setInputMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg flex flex-col"
      style={{ height: `${chatHeight}px` }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className={`flex items-center justify-center py-1 cursor-ns-resize hover:bg-gray-100 transition-colors ${
          isResizing ? 'bg-blue-100' : ''
        }`}
        title={t('chat.resizeHandle')}
      >
        <GripHorizontal className="text-gray-400" size={20} />
      </div>

      <div className="flex items-center gap-2 p-3 md:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <MessageSquare className="text-blue-600" size={20} />
        <h3 className="text-lg md:text-xl font-bold text-gray-900">{t('chat.title')}</h3>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center py-6 md:py-8 text-gray-500">
            <p className="text-sm md:text-base">{t('chat.noMessages')}</p>
            <p className="text-xs md:text-sm mt-2">{t('chat.startDiscussion')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMyMessage = msg.player_position === playerPosition;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-lg p-2.5 md:p-3 ${
                    isMyMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-baseline gap-1.5 md:gap-2 mb-1">
                    <span className={`text-xs font-semibold ${isMyMessage ? 'text-blue-100' : 'text-gray-600'}`}>
                      {msg.player_name}
                    </span>
                    <span className={`text-xs ${isMyMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('nl-NL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="break-words text-sm md:text-base">
                    {formatMessageWithSymbols(msg.message)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 md:p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('chat.typePlaceholder')}
            className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            disabled={isSending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] min-w-[44px]"
          >
            <Send size={18} />
            <span className="hidden md:inline">{isSending ? t('chat.sending') : t('chat.send')}</span>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <div>{t('chat.colorsHelp')}</div>
          <div>{t('chat.bidsHelp')}</div>
        </div>
      </form>
    </div>
  );
}
