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

    const messageContent = input.trim();
    const messageTimestamp = Date.now();

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
          content: messageContent,
          timestamp: messageTimestamp,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      console.log('[ArkivChat] Message sent:', result);

      // Immediately add the message optimistically to the UI
      const optimisticMessage: ChatMessage = {
        id: result.entityKey || `temp-${Date.now()}`,
        sender: userName,
        content: messageContent,
        timestamp: messageTimestamp,
        entityKey: result.entityKey || `temp-${Date.now()}`,
      };

      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.entityKey === optimisticMessage.entityKey)) {
          return prev;
        }
        return [...prev, optimisticMessage];
      });

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
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-white/70" style={{ fontFamily: 'Handjet, monospace' }}>
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        <span className="text-xs text-white/50">Messages expire in 1 min</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-white/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-white/40" style={{ fontFamily: 'Handjet, monospace' }}>
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const age = Date.now() - msg.timestamp;
            const timeRemaining = Math.max(0, MESSAGE_TTL_MS - age);
            const secondsRemaining = Math.ceil(timeRemaining / 1000);

            return (
              <div
                key={msg.entityKey}
                className={`flex flex-col gap-1 transition-all duration-1000 ${
                  msg.isExpired
                    ? 'opacity-0 scale-95 -translate-y-2'
                    : msg.isExpiring
                    ? 'opacity-60 scale-98'
                    : 'opacity-100 scale-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-white/20">
                    <span className="text-xs font-bold text-white">
                      {msg.sender.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white/80" style={{ fontFamily: 'Handjet, monospace' }}>
                    {msg.sender}
                  </span>
                  <span className="text-xs text-white/30">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.isExpiring && (
                    <div className="ml-auto flex items-center gap-1">
                      <svg className="h-3 w-3 text-yellow-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-mono text-yellow-400/70">{secondsRemaining}s</span>
                    </div>
                  )}
                </div>
                <div className="ml-9 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                  <p className="text-sm text-white/90 leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Press Enter to send)"
            disabled={!isConnected || isSending}
            className="flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/40 focus:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Handjet, monospace' }}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !input.trim() || isSending}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-2 text-sm font-bold text-white transition hover:from-cyan-400 hover:to-purple-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-500"
            style={{ fontFamily: 'Handjet, monospace' }}
          >
            {isSending ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
