# Arkiv Real-Time Chat

A real-time chat application built with Arkiv Network, featuring WebSocket subscriptions for live message delivery.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │◄───WS───┤ Arkiv Network│◄───TX───┤   Backend   │
│  (Subscription)│       │  (Storage)   │         │ (API Route) │
└─────────────┘         └──────────────┘         └─────────────┘
      │                                                  ▲
      └──────────────────HTTP POST──────────────────────┘
```

### How It Works

1. **Frontend subscribes** to Arkiv Network via WebSocket to listen for new chat messages
2. **User types a message** and clicks Send
3. **Frontend sends POST** request to `/api/chat/send` with message data
4. **Backend API route** signs the message with server's private key and creates an Arkiv entity
5. **Arkiv Network** stores the message and broadcasts it via WebSocket
6. **All connected clients** receive the message in real-time via their subscriptions

## Features

- ✅ Real-time message delivery via Arkiv WebSocket subscriptions
- ✅ Multiple chat rooms support
- ✅ Message persistence (7-day TTL by default)
- ✅ Beautiful synthwave UI matching the project theme
- ✅ Auto-scroll to latest messages
- ✅ Connection status indicator
- ✅ Server-side message signing for security

## Files Created

### 1. `/lib/arkiv.ts`
Utility functions for Arkiv client setup:
- `createArkivPublicClient()` - For reading messages
- `createArkivWalletClient()` - For writing messages (server-side only)
- Helper functions for encoding/decoding

### 2. `/app/components/ArkivChat.tsx`
Main chat component with:
- Real-time subscription to new messages
- Message history loading
- Send message UI
- Auto-scroll and connection status

### 3. `/app/api/chat/send/route.ts`
Next.js API route that:
- Receives message from frontend
- Signs with server's private key
- Creates Arkiv entity
- Returns success/error

### 4. `/app/chat/page.tsx`
Demo page showcasing:
- User name and room selection
- Full chat interface
- Leave/rejoin functionality

## Environment Variables

Add to `.env.local`:

```bash
# Public (frontend)
NEXT_PUBLIC_ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
NEXT_PUBLIC_ARKIV_WS_URL=wss://mendoza.hoodi.arkiv.network/rpc/ws

# Private (backend/API routes)
ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
ARKIV_PRIVATE_KEY=0x...your_private_key...
```

## Usage

### 1. Start the development server

```bash
npm run dev
```

### 2. Navigate to the chat page

```
http://localhost:3000/chat
```

### 3. Enter your name and select a room

### 4. Start chatting!

## Customization

### Change message expiration time

Edit `/app/api/chat/send/route.ts`:

```typescript
const DEFAULT_EXPIRES_IN = 604800; // 7 days in seconds
```

### Add new chat rooms

Edit `/app/chat/page.tsx`:

```typescript
<option value="your-room">Your Room</option>
```

### Customize message attributes

Edit the `attributes` array in `/app/api/chat/send/route.ts`:

```typescript
attributes: [
  { key: 'type', value: 'chat_message' },
  { key: 'roomId', value: roomId },
  { key: 'sender', value: sender },
  { key: 'timestamp', value: timestamp?.toString() },
  // Add your custom attributes here
  { key: 'customField', value: 'customValue' },
],
```

## Integration with Your Backend

If you want to use your existing backend server instead of Next.js API routes:

### 1. Update the frontend to call your backend

Edit `/app/components/ArkivChat.tsx`:

```typescript
const response = await fetch('https://your-backend.com/api/chat/send', {
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
```

### 2. Implement the endpoint in your backend

Example Python/FastAPI:

```python
from arkiv_sdk import WalletClient
import os

@app.post("/api/chat/send")
async def send_message(request: ChatMessageRequest):
    wallet_client = WalletClient(
        rpc_url=os.getenv("ARKIV_RPC_URL"),
        private_key=os.getenv("ARKIV_PRIVATE_KEY")
    )

    result = await wallet_client.create_entity(
        payload=request.content.encode(),
        content_type="text/plain",
        attributes=[
            {"key": "type", "value": "chat_message"},
            {"key": "roomId", "value": request.room_id},
            {"key": "sender", "value": request.sender},
            {"key": "timestamp", "value": str(request.timestamp)},
        ],
        expires_in=604800
    )

    return {"success": True, "entity_key": result.entity_key}
```

## Arkiv Network Details

- **Network**: Mendoza Testnet
- **RPC**: https://mendoza.hoodi.arkiv.network/rpc
- **WebSocket**: wss://mendoza.hoodi.arkiv.network/rpc/ws
- **Explorer**: https://explorer.arkiv.network
- **Faucet**: https://faucet.arkiv.network
- **Docs**: https://sdk.arkiv.network

## Message Structure

Each message is stored as an Arkiv entity with:

```typescript
{
  payload: Uint8Array,           // Message content (encoded)
  contentType: 'text/plain',
  attributes: [
    { key: 'type', value: 'chat_message' },
    { key: 'roomId', value: 'general' },
    { key: 'sender', value: 'Alice' },
    { key: 'timestamp', value: '1699999999999' }
  ],
  expiresIn: 604800  // 7 days
}
```

## Troubleshooting

### Messages not appearing in real-time

1. Check browser console for WebSocket connection errors
2. Verify `NEXT_PUBLIC_ARKIV_WS_URL` is set correctly
3. Check network tab for failed WS connection
4. Ensure firewall allows WebSocket connections

### "Failed to send message" error

1. Verify `ARKIV_PRIVATE_KEY` is set in `.env.local`
2. Check server console for detailed error messages
3. Ensure the private key has funds (get from faucet)
4. Verify RPC URL is accessible

### Messages not persisting

1. Check that `expiresIn` is greater than 0
2. Verify the transaction was successful (check `txHash`)
3. Query Arkiv directly to confirm entity creation

## Next Steps

- Add user authentication
- Implement message reactions/threading
- Add file/image upload support
- Implement end-to-end encryption
- Add message editing/deletion
- Create admin moderation tools
- Add typing indicators
- Implement read receipts

## Support

- **Arkiv Docs**: https://docs.arkiv.network
- **Discord**: https://discord.gg/arkiv
- **GitHub**: https://github.com/arkiv-network
