const ID_LEN = 4;
const PART_LEN = 1;
const LEN_LEN = 2;
const PART_VER_LEN = 1;
const HEADER_LEN = ID_LEN + PART_LEN + LEN_LEN + PART_VER_LEN;
const NUM_PARTS_LEN = 1;
const TYPE_LEN = 4;
const TIMESTAMP_LEN = 8;
const FIRST_PART_VER_LEN = 1;
const FIRST_HEADER_LEN = HEADER_LEN + NUM_PARTS_LEN + TYPE_LEN + TIMESTAMP_LEN + FIRST_PART_VER_LEN;

const MESSAGE_PART_VERSION = 0;
const FIRST_MESSAGE_PART_VERSION = 0;

export const MAX_MESSAGE_PARTS = 255;
export const DEFAULT_MAX_MESSAGE_LENGTH = 926;
export const DEFAULT_MESSAGE_TYPE = 2; // catalog.XxMessage

const textEncoder = new TextEncoder();

export interface PartitionOptions {
  messageType?: number;
  timestampNs?: bigint;
  maxMessageLength?: number;
}

export interface PartitionResult {
  parts: Uint8Array[];
  fullMessageId: bigint;
  truncatedMessageId: number;
  numParts: number;
}

export class ConversationCounter {
  private nextSendId: bigint;

  constructor(initialId: bigint = 0n) {
    this.nextSendId = initialId;
  }

  public next(): { full: bigint; truncated: number } {
    const full = this.nextSendId;
    this.nextSendId = (this.nextSendId + 1n) & 0xffffffffffffffffn;
    return { full, truncated: Number(full & 0xffffffffn) };
  }

  public set(nextId: bigint): void {
    this.nextSendId = nextId & 0xffffffffffffffffn;
  }

  public serialize(): string {
    return this.nextSendId.toString();
  }
}

export function encodeText(message: string): Uint8Array {
  return textEncoder.encode(message);
}

export function getMaxPayloadSize(maxMessageLength = DEFAULT_MAX_MESSAGE_LENGTH): number {
  const firstChunk = getFirstPartitionSize(maxMessageLength);
  const partChunk = getSubsequentPartitionSize(maxMessageLength);
  return firstChunk + (MAX_MESSAGE_PARTS - 1) * partChunk;
}

export function getFirstPartitionSize(maxMessageLength = DEFAULT_MAX_MESSAGE_LENGTH): number {
  return maxMessageLength - FIRST_HEADER_LEN;
}

export function getSubsequentPartitionSize(maxMessageLength = DEFAULT_MAX_MESSAGE_LENGTH): number {
  return maxMessageLength - HEADER_LEN;
}

export function partitionPayload(
  payload: Uint8Array,
  counter: ConversationCounter,
  options: PartitionOptions = {}
): PartitionResult {
  const maxMessageLength = options.maxMessageLength ?? DEFAULT_MAX_MESSAGE_LENGTH;
  const firstPartitionSize = getFirstPartitionSize(maxMessageLength);
  const partContentsSize = getSubsequentPartitionSize(maxMessageLength);
  const maxPayload = getMaxPayloadSize(maxMessageLength);

  if (payload.length > maxPayload) {
    throw new Error(`Payload too large: ${payload.length} bytes exceeds cap of ${maxPayload}`);
  }

  const { full: fullMessageId, truncated: truncatedId } = counter.next();
  const numParts = calculatePartCount(payload.length, firstPartitionSize, partContentsSize);
  const messageType = options.messageType ?? DEFAULT_MESSAGE_TYPE;
  const timestamp = options.timestampNs ?? currentTimestampNs();

  const parts: Uint8Array[] = [];
  const firstSlice = payload.slice(0, Math.min(firstPartitionSize, payload.length));
  parts.push(
    buildFirstPart({
      baseSize: maxMessageLength,
      contents: firstSlice,
      messageId: truncatedId,
      numParts,
      messageType,
      timestamp,
    })
  );

  let cursor = firstSlice.length;
  let partIndex = 1;
  while (cursor < payload.length) {
    const nextSlice = payload.slice(cursor, cursor + partContentsSize);
    parts.push(
      buildContinuationPart({
        baseSize: maxMessageLength,
        contents: nextSlice,
        messageId: truncatedId,
        partIndex,
      })
    );
    cursor += nextSlice.length;
    partIndex += 1;
  }

  return { parts, fullMessageId, truncatedMessageId: truncatedId, numParts };
}

export function reconstructPayload(parts: Uint8Array[]): Uint8Array {
  const buffers: Uint8Array[] = [];
  for (const part of parts) {
    const chunkLength = readUint16(part, ID_LEN + PART_LEN);
    const partIndex = part[ID_LEN];
    const baseOffset = ID_LEN + PART_LEN + LEN_LEN;
    const metaOffset = partIndex === 0 ? NUM_PARTS_LEN + TYPE_LEN + TIMESTAMP_LEN : 0;
    const payloadOffset = baseOffset + metaOffset;
    const capacity = partIndex === 0 ? part.length - FIRST_HEADER_LEN : part.length - HEADER_LEN;
    const length = Math.min(chunkLength, capacity);
    buffers.push(part.slice(payloadOffset, payloadOffset + length));
  }
  return concat(buffers);
}

type FirstPartParams = {
  baseSize: number;
  contents: Uint8Array;
  messageId: number;
  numParts: number;
  messageType: number;
  timestamp: bigint;
};

type ContinuationParams = {
  baseSize: number;
  contents: Uint8Array;
  messageId: number;
  partIndex: number;
};

function buildFirstPart(params: FirstPartParams): Uint8Array {
  const { baseSize, contents, messageId, numParts, messageType, timestamp } = params;
  const buffer = new Uint8Array(baseSize);
  const view = createView(buffer);
  view.setUint32(0, messageId);
  buffer[ID_LEN] = 0;
  view.setUint16(ID_LEN + PART_LEN, contents.length);
  buffer[ID_LEN + PART_LEN + LEN_LEN] = numParts;
  view.setUint32(ID_LEN + PART_LEN + LEN_LEN + NUM_PARTS_LEN, messageType);
  view.setBigUint64(ID_LEN + PART_LEN + LEN_LEN + NUM_PARTS_LEN + TYPE_LEN, timestamp);

  const contentsOffset = ID_LEN + PART_LEN + LEN_LEN + NUM_PARTS_LEN + TYPE_LEN + TIMESTAMP_LEN;
  buffer.set(contents, contentsOffset);
  buffer[baseSize - 1] = FIRST_MESSAGE_PART_VERSION;
  return buffer;
}

function buildContinuationPart(params: ContinuationParams): Uint8Array {
  const { baseSize, contents, messageId, partIndex } = params;
  const buffer = new Uint8Array(baseSize);
  const view = createView(buffer);
  view.setUint32(0, messageId);
  buffer[ID_LEN] = partIndex;
  view.setUint16(ID_LEN + PART_LEN, contents.length);
  const contentsOffset = ID_LEN + PART_LEN + LEN_LEN;
  buffer.set(contents, contentsOffset);
  buffer[baseSize - 1] = MESSAGE_PART_VERSION;
  return buffer;
}

function calculatePartCount(payloadLength: number, firstSize: number, otherSize: number): number {
  if (payloadLength === 0) {
    return 1;
  }
  if (payloadLength <= firstSize) {
    return 1;
  }
  const remaining = payloadLength - firstSize;
  const extraParts = Math.ceil(remaining / otherSize);
  const total = 1 + extraParts;
  if (total > MAX_MESSAGE_PARTS) {
    throw new Error(`Payload needs ${total} parts which exceeds limit of ${MAX_MESSAGE_PARTS}`);
  }
  return total;
}

function currentTimestampNs(): bigint {
  const ms = BigInt(Date.now());
  return ms * 1_000_000n;
}

function readUint16(data: Uint8Array, offset: number): number {
  const view = createView(data);
  return view.getUint16(offset);
}

function createView(data: Uint8Array): DataView {
  return new DataView(data.buffer, data.byteOffset, data.byteLength);
}

function concat(buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((sum, chunk) => sum + chunk.length, 0);
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of buffers) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  return joined;
}
