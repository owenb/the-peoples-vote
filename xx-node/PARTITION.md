# Message Chunking and Partitioning APIs

This document describes the available APIs for breaking large messages into multiple cMix messages.

## 1. E2E Message Partitioner (Recommended)

The primary API for breaking large messages into multiple cMix messages for end-to-end encrypted communication.

**Location:** `e2e/parse/partition.go`

```go
type Partitioner struct {
	baseMessageSize   int
	firstContentsSize int
	partContentsSize  int
	maxSize           int
	// ...
}

// Create a new partitioner
func NewPartitioner(kv versioned.KV, messageSize int) *Partitioner

// Partition breaks a message into multiple parts
func (p *Partitioner) Partition(recipient *id.ID, mt catalog.MessageType,
	timestamp time.Time, payload []byte) ([][]byte, uint64, error)

// Query methods for size information
func (p *Partitioner) FirstPartitionSize() uint
func (p *Partitioner) SecondPartitionSize() uint
func (p *Partitioner) PayloadSize() uint  // Max total payload size
```

**Key Features:**
- Supports up to 255 message parts (`MaxMessageParts = 255`)
- First part has different size than subsequent parts (due to headers)
- Automatically handles message IDs and reassembly on receive
- Returns the full message ID for tracking

## 2. File Transfer Partitioning

For file transfers, there's a dedicated partitioning system.

**Location:** `channelsFileTransfer/manager.go`

```go
// partitionFile splits the file into parts of the specified part size
func partitionFile(file []byte, partSize int) [][]byte
```

## 3. Single-Use Request Partitioning

For request/response patterns.

**Location:** `single/receivedRequest.go`

```go
// partitionResponse breaks a payload into its sub payloads for sending
func partitionResponse(payload []byte, cmixMessageLength int,
	maxParts uint8) []message.ResponsePart

// splitPayload splits the given payload into separate payload parts
func splitPayload(payload []byte, maxSize, maxParts int) [][]byte
```

## 4. RPC Message Partitioning

For RPC-style communication.

**Location:** `rpc/msg.go`

```go
// partitionMessage creates an ordered partition of messages based on sizes
func partitionMessage(msg []byte, headerMsgSize, otherMsgSize uint64) [][]byte
```

## Getting Maximum Message Size

To determine how much data fits in a single cMix message:

```go
// GetMaxMessageLength returns the maximum length of a cMix message
func (c *client) GetMaxMessageLength() int {
	return c.maxMsgLen
}
```

## Recommended Approach

For most use cases, **use the E2E Partitioner**:

1. Create a partitioner: `NewPartitioner(kv, messageSize)`
2. Call `Partition()` to break your message into chunks
3. The API handles reassembly on the receiver side automatically
4. Supports up to 255 parts with automatic message ID tracking

The partitioner is designed to work seamlessly with the rest of the e2e messaging system and handles all the complexity of headers, message IDs, and reassembly.

