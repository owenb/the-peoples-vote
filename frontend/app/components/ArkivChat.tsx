'use client';

import { useEffect, useState, useRef } from 'react';
import { createPublicClient, http } from 'viem';
import { defineChain } from 'viem';

// Define Mendoza chain (Arkiv testnet)
const mendoza = defineChain({
  id: 31337, // Arkiv testnet chain ID
  name: 'Mendoza',
  network: 'mendoza',
  nativeCurrency: {
    name: 'Arkiv',
    symbol: 'ARKIV',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://mendoza.hoodi.arkiv.network/rpc'] },
    public: { http: ['https://mendoza.hoodi.arkiv.network/rpc'] },
  },
  testnet: true,
});

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
  entityKey: string;
  isExpiring?: boolean;
  isExpired?: boolean;
}

interface ArkivChatProps {
  roomId?: string;
  userName?: string;
}

export default function ArkivChat({ roomId = 'default', userName = 'Anonymous' }: ArkivChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const publicClientRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const MESSAGE_TTL_MS = 60000; // 1 minute in milliseconds
  const EXPIRING_THRESHOLD_MS = 10000; // Start fading at 10 seconds remaining

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for expiring/expired messages every second
  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();

      setMessages((prevMessages) => {
        let hasChanges = false;
        const updatedMessages = prevMessages
          .map((msg) => {
            const age = now - msg.timestamp;
            const timeRemaining = MESSAGE_TTL_MS - age;

            // Mark as expired if past TTL
            if (timeRemaining <= 0 && !msg.isExpired) {
              hasChanges = true;
              return { ...msg, isExpired: true, isExpiring: false };
            }

            // Mark as expiring if within threshold
            if (timeRemaining <= EXPIRING_THRESHOLD_MS && timeRemaining > 0 && !msg.isExpiring) {
              hasChanges = true;
              return { ...msg, isExpiring: true };
            }

            return msg;
          })
          // Remove expired messages after a delay
          .filter((msg) => {
            if (msg.isExpired) {
              const timeSinceExpiry = now - (msg.timestamp + MESSAGE_TTL_MS);
              return timeSinceExpiry < 2000; // Keep for 2 seconds after expiry for animation
            }
            return true;
          });

        return hasChanges || updatedMessages.length !== prevMessages.length ? updatedMessages : prevMessages;
      });
    };

    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [MESSAGE_TTL_MS, EXPIRING_THRESHOLD_MS]);

  // Initialize Arkiv client and subscription
  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      try {
        // Create public client for reading
        const publicClient = createPublicClient({
          chain: mendoza,
          transport: http(process.env.NEXT_PUBLIC_ARKIV_RPC_URL || 'https://mendoza.hoodi.arkiv.network/rpc'),
        });

        publicClientRef.current = publicClient;

        // Load existing messages
        await loadExistingMessages(publicClient);

        // Subscribe to new messages
        const stopSubscription = await subscribeToMessages(publicClient);
        unsubscribeRef.current = stopSubscription;

        if (mounted) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('[ArkivChat] Initialization error:', error);
      }
    };

    initializeChat();

    return () => {
      mounted = false;
      // Clean up subscription on unmount
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [roomId]);

  // Load existing messages from Arkiv
  const loadExistingMessages = async (client: any) => {
    try {
      const query = client
        .buildQuery()
        .where([
          { key: 'type', value: 'chat_message' },
          { key: 'roomId', value: roomId },
        ]);

      const result = await query.fetch();

      const loadedMessages: ChatMessage[] = result.entities.map((entity: any) => {
        const attrs = Object.fromEntries(
          entity.attributes.map((a: any) => [a.key, a.value])
        );

        return {
          id: entity.entityKey,
          sender: attrs.sender || 'Unknown',
          content: new TextDecoder().decode(entity.payload),
          timestamp: parseInt(attrs.timestamp || '0'),
          entityKey: entity.entityKey,
        };
      });

      // Sort by timestamp
      loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('[ArkivChat] Error loading messages:', error);
    }
  };

  // Subscribe to real-time message events
  const subscribeToMessages = async (client: any): Promise<() => void> => {
    try {
      const stopFn = await client.subscribeEntityEvents({
        onEntityCreated: async (event: any) => {
          try {
            const entity = await client.getEntity(event.entityKey);
            const attrs = Object.fromEntries(
              entity.attributes.map((a: any) => [a.key, a.value])
            );

            // Only process chat messages for this room
            if (attrs.type === 'chat_message' && attrs.roomId === roomId) {
              const newMessage: ChatMessage = {
                id: entity.entityKey,
                sender: attrs.sender || 'Unknown',
                content: new TextDecoder().decode(entity.payload),
                timestamp: parseInt(attrs.timestamp || Date.now().toString()),
                entityKey: entity.entityKey,
              };

              setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((m) => m.entityKey === newMessage.entityKey)) {
                  return prev;
                }
                return [...prev, newMessage];
              });

              console.log('[ArkivChat] New message received:', newMessage.content);
            }
          } catch (err) {
            console.error('[ArkivChat] Error processing new message:', err);
          }
        },

        onEntityExpiresInExtended: (event: any) => {
          console.log('[ArkivChat] Message extended:', event.entityKey);
        },

        onError: (err: any) => {
          console.error('[ArkivChat] Subscription error:', err);
          setIsConnected(false);
        },
      });

      console.log('[ArkivChat] Subscribed to real-time messages for room:', roomId);
      return stopFn;
    } catch (error) {
      console.error('[ArkivChat] Subscription setup error:', error);
      return () => {};
    }
  };

  // Send message via backend API
  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    setIsSending(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          sender: userName,
          content: input.trim(),
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      console.log('[ArkivChat] Message sent:', result);

      // Clear input
      setInput('');
    } catch (error) {
      console.error('[ArkivChat] Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/20 p-4">
        <div>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Handjet, monospace' }}>
            Arkiv Chat
          </h2>
          <p className="text-sm text-white/60">Room: {roomId}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-white/70">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-white/50">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const age = Date.now() - msg.timestamp;
            const timeRemaining = Math.max(0, MESSAGE_TTL_MS - age);
            const secondsRemaining = Math.ceil(timeRemaining / 1000);

            return (
              <div
                key={msg.entityKey}
                className={`flex transition-all duration-1000 ${
                  msg.sender === userName ? 'justify-end' : 'justify-start'
                } ${
                  msg.isExpired
                    ? 'opacity-0 scale-95 -translate-y-2'
                    : msg.isExpiring
                    ? 'opacity-60 scale-98'
                    : 'opacity-100 scale-100'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 transition-all duration-500 ${
                    msg.sender === userName
                      ? 'bg-blue-500/30 text-white'
                      : 'bg-white/20 text-white'
                  } ${
                    msg.isExpiring ? 'border border-yellow-400/50 shadow-lg shadow-yellow-400/20' : ''
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-white/90">{msg.sender}</span>
                    <span className="text-xs text-white/50">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.isExpiring && (
                      <span className="text-xs font-bold text-yellow-300 animate-pulse">
                        {secondsRemaining}s
                      </span>
                    )}
                  </div>
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/20 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={!isConnected || isSending}
            className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none transition focus:border-white/40 focus:bg-white/20 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !input.trim() || isSending}
            className="rounded-full bg-blue-500 px-6 py-2 font-bold text-white transition hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="mt-2 text-xs text-white/50">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
