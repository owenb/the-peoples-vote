import { NextRequest, NextResponse } from 'next/server';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mendoza } from '@arkiv-network/sdk';

// Arkiv configuration
const ARKIV_RPC_URL = process.env.ARKIV_RPC_URL || 'https://mendoza.hoodi.arkiv.network/rpc';
const ARKIV_PRIVATE_KEY = process.env.ARKIV_PRIVATE_KEY;
const DEFAULT_EXPIRES_IN = 604800; // 7 days in seconds

/**
 * POST /api/chat/send
 * Send a chat message to Arkiv
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, sender, content, timestamp } = body;

    // Validate input
    if (!roomId || !sender || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: roomId, sender, content' },
        { status: 400 }
      );
    }

    if (!ARKIV_PRIVATE_KEY) {
      console.error('[Chat API] ARKIV_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create wallet client with server's private key
    const walletClient = createWalletClient({
      chain: mendoza,
      transport: http(ARKIV_RPC_URL),
      account: privateKeyToAccount(ARKIV_PRIVATE_KEY as `0x${string}`),
    });

    // Convert content to payload
    const payload = new TextEncoder().encode(content);

    // Create entity on Arkiv
    const { entityKey, txHash } = await walletClient.createEntity({
      payload,
      contentType: 'text/plain',
      attributes: [
        { key: 'type', value: 'chat_message' },
        { key: 'roomId', value: roomId },
        { key: 'sender', value: sender },
        { key: 'timestamp', value: timestamp?.toString() || Date.now().toString() },
      ],
      expiresIn: DEFAULT_EXPIRES_IN,
    });

    console.log('[Chat API] Message sent:', {
      entityKey,
      txHash,
      roomId,
      sender,
      contentLength: content.length,
    });

    return NextResponse.json({
      success: true,
      entityKey,
      txHash,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('[Chat API] Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/send
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Arkiv Chat API',
    endpoints: {
      POST: '/api/chat/send - Send a message',
    },
  });
}
