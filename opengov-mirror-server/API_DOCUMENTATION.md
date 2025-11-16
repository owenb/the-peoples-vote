# OpenGov Mirror Server API Documentation

Base URL: `http://localhost:8000` (or configured HOST:PORT)

All endpoints return JSON responses. CORS is enabled for all origins by default.

## Health & Monitoring

### GET /health
Basic health check

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T06:42:22.424Z",
  "uptime": 22.74
}
```

### GET /health/detailed
Detailed health check with service status

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-16T06:42:29.383Z",
  "uptime": 29.70,
  "services": {
    "database": true,
    "paseo": true,
    "arkiv": true
  },
  "stats": {
    "total": 5,
    "pending": 0,
    "processing": 0,
    "completed": 5,
    "failed": 0
  },
  "paseoBalance": "4583.5459168797",
  "error": null
}
```

### GET /stats
Get proposal statistics

**Response:**
```json
{
  "total": 5,
  "pending": 0,
  "processing": 0,
  "completed": 5,
  "failed": 0
}
```

## Proposals

### GET /proposals
Get all proposals with optional filtering and pagination

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `processing`, `completed`, `failed`)
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
GET /proposals?status=completed&limit=10&offset=0
```

**Response:**
```json
[
  {
    "id": 1,
    "polkassemblyId": 1790,
    "polkassemblyTitle": "Proposal Title",
    "polkassemblyContent": "Full proposal content...",
    "polkassemblyUrl": "https://polkadot.polkassembly.io/referenda/1790",
    "polkassemblyStatus": "Deciding",
    "polkassemblyTrack": 15,
    "polkassemblyCreatedAt": "2025-11-15T12:00:00.000Z",
    "arkivCid": "0x1234...",
    "arkivUrl": "https://mendoza.hoodi.arkiv.network/rpc/entity/0x1234...",
    "paseoVoteContractAddress": "0xabcd...",
    "paseoTxHash": "0x5678...",
    "paseoBlockNumber": 12345,
    "processingStatus": "completed",
    "errorMessage": null,
    "createdAt": "2025-11-15T12:05:00.000Z",
    "updatedAt": "2025-11-15T12:10:00.000Z"
  }
]
```

### GET /proposals/active
Get active proposals (inscription or voting still open)

Returns proposals with hydrated vote statistics where the vote contract is still accepting inscriptions or votes.

**Query Parameters:**
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
[
  {
    "id": 1,
    "polkassemblyId": 1790,
    "polkassemblyTitle": "Proposal Title",
    "polkassemblyContent": "Full proposal content...",
    "polkassemblyUrl": "https://polkadot.polkassembly.io/referenda/1790",
    "polkassemblyStatus": "Deciding",
    "polkassemblyTrack": 15,
    "polkassemblyCreatedAt": "2025-11-15T12:00:00.000Z",
    "arkivCid": "0x1234...",
    "arkivUrl": "https://mendoza.hoodi.arkiv.network/rpc/entity/0x1234...",
    "paseoVoteContractAddress": "0xabcd...",
    "paseoTxHash": "0x5678...",
    "paseoBlockNumber": 12345,
    "processingStatus": "completed",
    "errorMessage": null,
    "createdAt": "2025-11-15T12:05:00.000Z",
    "updatedAt": "2025-11-15T12:10:00.000Z",
    "voteStats": {
      "enscribedVoters": 2,
      "votedVoters": 1,
      "maximalNumberOfVoters": 3,
      "yesVotes": 0,
      "finalVote": null,
      "voters": [
        {
          "address": "0x1111...",
          "hasVoted": true
        },
        {
          "address": "0x2222...",
          "hasVoted": false
        }
      ],
      "isInscriptionOpen": true,
      "isVotingOpen": false,
      "isFinalized": false
    }
  }
]
```

### GET /proposals/:id
Get proposal by internal ID

**Parameters:**
- `id`: Proposal ID (positive integer)

**Response:** Same structure as `/proposals` but single object

### GET /proposals/:id/full
Get proposal with full hydrated data (Arkiv content + Vote stats)

**This is the main endpoint for frontend integration!**

Returns proposal with the actual Arkiv content (not just CID) and live voting statistics from the Paseo vote contract.

**Parameters:**
- `id`: Proposal ID (positive integer)

**Response:**
```json
{
  "id": 1,
  "polkassemblyId": 1790,
  "polkassemblyTitle": "Proposal Title",
  "polkassemblyContent": "Full proposal content...",
  "polkassemblyUrl": "https://polkadot.polkassembly.io/referenda/1790",
  "polkassemblyStatus": "Deciding",
  "polkassemblyTrack": 15,
  "polkassemblyCreatedAt": "2025-11-15T12:00:00.000Z",
  "arkivCid": "0x1234...",
  "arkivUrl": "https://mendoza.hoodi.arkiv.network/rpc/entity/0x1234...",
  "paseoVoteContractAddress": "0xabcd...",
  "paseoTxHash": "0x5678...",
  "paseoBlockNumber": 12345,
  "processingStatus": "completed",
  "errorMessage": null,
  "createdAt": "2025-11-15T12:05:00.000Z",
  "updatedAt": "2025-11-15T12:10:00.000Z",
  "arkivContent": "Full proposal description retrieved from Arkiv network...",
  "voteStats": {
    "enscribedVoters": 3,
    "votedVoters": 3,
    "maximalNumberOfVoters": 3,
    "yesVotes": 2,
    "finalVote": true,
    "voters": [
      {
        "address": "0x1111...",
        "hasVoted": true
      },
      {
        "address": "0x2222...",
        "hasVoted": true
      },
      {
        "address": "0x3333...",
        "hasVoted": true
      }
    ],
    "isInscriptionOpen": false,
    "isVotingOpen": false,
    "isFinalized": true
  }
}
```

**Vote Stats Explained:**
- `enscribedVoters`: Number of voters who have registered
- `votedVoters`: Number of voters who have submitted votes
- `maximalNumberOfVoters`: Total voter slots available
- `yesVotes`: Number of yes votes (only available when finalized)
- `finalVote`: Final vote result (true = passed, false = failed, null = not finalized)
- `isInscriptionOpen`: Whether voters can still register
- `isVotingOpen`: Whether voting is in progress
- `isFinalized`: Whether all votes are in and result is final

### GET /proposals/polkassembly/:polkassemblyId
Get proposal by Polkassembly ID

**Parameters:**
- `polkassemblyId`: Polkassembly proposal ID (positive integer)

**Response:** Same structure as `/proposals/:id`

## Administrative

### POST /sync
Trigger manual sync from Polkassembly

**Response:**
```json
{
  "status": "completed",
  "message": "Sync completed: 3 new proposals mirrored",
  "stats": {
    "scraped": 5,
    "alreadyProcessed": 2,
    "newlyMirrored": 3,
    "failed": 0,
    "errors": []
  }
}
```

### POST /retry-failed
Retry processing of failed proposals

**Response:**
```json
{
  "status": "completed",
  "message": "Retry completed: 1 proposals recovered",
  "stats": {
    "scraped": 1,
    "alreadyProcessed": 0,
    "newlyMirrored": 1,
    "failed": 0,
    "errors": []
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes:**
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (proposal doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

**Rate Limiting:**
- Default: 100 requests per minute per IP
- Returns 429 with `retryAfter` field (seconds)

## Frontend Integration Examples

### Fetch Active Proposals
```typescript
const response = await fetch('http://localhost:8000/proposals/active');
const activeProposals = await response.json();
```

### Fetch Proposal with Full Data
```typescript
const proposalId = 1;
const response = await fetch(`http://localhost:8000/proposals/${proposalId}/full`);
const proposal = await response.json();

// Access Arkiv content
console.log(proposal.arkivContent);

// Check vote status
if (proposal.voteStats) {
  console.log(`Votes: ${proposal.voteStats.votedVoters}/${proposal.voteStats.maximalNumberOfVoters}`);

  if (proposal.voteStats.isFinalized) {
    console.log(`Result: ${proposal.voteStats.finalVote ? 'PASSED' : 'FAILED'}`);
  } else if (proposal.voteStats.isVotingOpen) {
    console.log('Voting is open!');
  } else if (proposal.voteStats.isInscriptionOpen) {
    console.log('Registration is open!');
  }
}
```

### TypeScript Interfaces

```typescript
interface Proposal {
  id: number;
  polkassemblyId: number;
  polkassemblyTitle: string;
  polkassemblyContent: string;
  polkassemblyUrl: string;
  polkassemblyStatus: string;
  polkassemblyTrack: number | null;
  polkassemblyCreatedAt: string;
  arkivCid: string | null;
  arkivUrl: string | null;
  paseoVoteContractAddress: string | null;
  paseoTxHash: string | null;
  paseoBlockNumber: number | null;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProposalFull extends Proposal {
  arkivContent: string | null;
  voteStats: VoteStats | null;
}

interface VoteStats {
  enscribedVoters: number;
  votedVoters: number;
  maximalNumberOfVoters: number;
  yesVotes: number;
  finalVote: boolean | null;
  voters: Array<{
    address: string;
    hasVoted: boolean;
  }>;
  isInscriptionOpen: boolean;
  isVotingOpen: boolean;
  isFinalized: boolean;
}
```
