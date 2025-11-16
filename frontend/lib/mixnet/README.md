# Mixnet Partition Helpers

Utilities for preparing xx network message payloads from TypeScript so they
match the Go partitioner (`e2e/parse/partition.go`).

```ts
import { ConversationCounter, encodeText, partitionPayload } from "@/lib/mixnet/partition";

const counter = new ConversationCounter();
const payload = encodeText("very long message...");
const { parts, truncatedMessageId, numParts } = partitionPayload(payload, counter);

for (const part of parts) {
  await cmix.send(part); // replace with your SDK call
}
```

Each entry in `parts` is already padded to the network packet size (926 bytes by
default). The first element carries the total part count, message type, and
timestamp so the Go server can reassemble it with `partition.Store`.

Key facts:

- First packet holds 904 bytes, remaining packets hold 918 bytes.
- Hard limit is 255 packets => ~234 KB per logical message.
- `ConversationCounter` mirrors Go's conversation store so truncated IDs appear
  sequential, which is required for `ProcessReceivedMessageID`.
- `reconstructPayload()` can be used in tests to ensure what you partition on
  the client round-trips to the original payload.
```
