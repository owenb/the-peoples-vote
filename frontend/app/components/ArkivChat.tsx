'use client';

import { useEffect, useState, useRef } from 'react';
import { createPublicClient, http } from '@arkiv-network/sdk';
import { mendoza } from '@arkiv-network/sdk/chains';
import { eq } from '@arkiv-network/sdk/query';

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
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const MESSAGE_TTL_MS = 60000; // 1 minute in milliseconds
  const EXPIRING_THRESHOLD_MS = 10000; // Start fading at 10 seconds remaining
  const ARKIV_RPC_URL = process.env.NEXT_PUBLIC_ARKIV_RPC_URL || 'https://mendoza.hoodi.arkiv.network/rpc';

  // No auto-scroll - let users control their own scrolling

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
              return timeSinceExpiry < 3000; // Keep for 3 seconds after expiry for animation
            }
            return true;
          });

        // Only update if something actually changed
        if (!hasChanges && updatedMessages.length === prevMessages.length) {
          return prevMessages;
        }

        return updatedMessages;
      });
    };

    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [MESSAGE_TTL_MS, EXPIRING_THRESHOLD_MS]);

  // Load messages helper that creates a fresh client each time
  const loadMessages = async () => {
    try {
      // Create a fresh client for each request to avoid filter issues
      const client = createPublicClient({
        chain: mendoza,
        transport: http(ARKIV_RPC_URL),
      });

      await loadExistingMessages(client);
    } catch (error) {
      console.error('[ArkivChat] Error loading messages:', error);
    }
  };

  // Initialize chat and start polling
  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      try {
        // Initial load
        await loadMessages();

        // Poll for new messages every 3 seconds
        const interval = setInterval(() => {
          if (mounted) {
            loadMessages();
          }
        }, 3000);

        pollIntervalRef.current = interval;

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
      // Clean up polling on unmount
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [roomId]);

  // Load existing messages from Arkiv
  const loadExistingMessages = async (client: any) => {
    try {
      console.log('[ArkivChat] Loading messages for room:', roomId);

      // Build query using the SDK's query builder with eq() helpers
      const result = await client
        .buildQuery()
        .where([
          eq('type', 'chat_message'),
          eq('roomId', roomId),
        ])
        .fetch();

      console.log('[ArkivChat] Raw query result:', result);
      console.log('[ArkivChat] Entities count:', result.entities?.length || 0);

      // Fetch full entity details for each entity key
      const loadedMessages: ChatMessage[] = [];

      for (const partialEntity of result.entities || []) {
        try {
          console.log('[ArkivChat] Fetching full entity for key:', partialEntity.key);

          // Get the full entity with attributes and payload
          const fullEntity = await client.getEntity(partialEntity.key);

          console.log('[ArkivChat] Full entity:', fullEntity);
          console.log('[ArkivChat] Full entity attributes:', fullEntity.attributes);
          console.log('[ArkivChat] Full entity payload:', fullEntity.payload);

          const attrs = Object.fromEntries(
            fullEntity.attributes.map((a: any) => [a.key, a.value])
          );

          console.log('[ArkivChat] Parsed attributes:', attrs);

          // Decode payload using toText() method
          let content = '';
          try {
            if (typeof fullEntity.toText === 'function') {
              content = fullEntity.toText();
            } else if (fullEntity.payload && typeof fullEntity.payload === 'object') {
              const bytes = fullEntity.payload.data || fullEntity.payload;
              content = new TextDecoder().decode(new Uint8Array(bytes));
            } else if (typeof fullEntity.payload === 'string') {
              content = fullEntity.payload;
            } else {
              content = '[Unknown payload format]';
            }

            console.log('[ArkivChat] Decoded content:', content);
          } catch (err) {
            console.error('[ArkivChat] Error decoding payload:', err);
            content = '[Error decoding message]';
          }

          const message = {
            id: fullEntity.key || `temp-${Date.now()}`,
            sender: attrs.sender || 'Unknown',
            content,
            timestamp: parseInt(attrs.timestamp || Date.now().toString()),
            entityKey: fullEntity.key,
          };

          console.log('[ArkivChat] Final message:', message);
          loadedMessages.push(message);
        } catch (err) {
          console.error('[ArkivChat] Error fetching entity:', partialEntity.key, err);
        }
      }

      // Sort by timestamp
      loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
      console.log('[ArkivChat] Total messages loaded:', loadedMessages.length);

      // Only update state if messages have actually changed
      setMessages((prevMessages) => {
        // Check if the messages are different
        if (prevMessages.length !== loadedMessages.length) {
          return loadedMessages;
        }

        // Check if any message content has changed
        const hasChanges = loadedMessages.some((newMsg, idx) => {
          const oldMsg = prevMessages[idx];
          return !oldMsg ||
                 oldMsg.entityKey !== newMsg.entityKey ||
                 oldMsg.content !== newMsg.content ||
                 oldMsg.timestamp !== newMsg.timestamp;
        });

        if (hasChanges) {
          return loadedMessages;
        }

        // No changes, keep previous state
        return prevMessages;
      });
    } catch (error) {
      console.error('[ArkivChat] Error loading messages:', error);
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

      // Clear input immediately
      setInput('');

      // Trigger an immediate refresh to show the new message
      await loadMessages();
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-4">
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
          messages.map((msg, idx) => {
            const age = Date.now() - msg.timestamp;
            const timeRemaining = Math.max(0, MESSAGE_TTL_MS - age);
            const secondsRemaining = Math.ceil(timeRemaining / 1000);

            return (
              <div
                key={msg.entityKey || msg.id || `msg-${idx}`}
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
