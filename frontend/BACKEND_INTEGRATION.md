# Backend Integration Guide

This document explains how the frontend integrates with the opengov-mirror-server backend to fetch and display proposal data.

## Overview

The frontend now fetches real proposal data from the backend API instead of using hardcoded values. This includes:

- **Proposal metadata** from Polkassembly
- **Arkiv content** (full proposal descriptions stored on Arkiv network)
- **Vote statistics** from Paseo Asset Hub smart contracts

## Architecture

```
┌─────────────────┐
│                 │
│    Frontend     │──┐
│   (Next.js)     │  │
│                 │  │
└─────────────────┘  │
                     │ HTTP
                     │ Requests
┌─────────────────┐  │
│                 │◄─┘
│    Backend      │
│  (Express API)  │
│                 │
└────────┬────────┘
         │
    ┌────┴─────┬──────────────┬──────────────┐
    │          │              │              │
    ▼          ▼              ▼              ▼
┌────────┐ ┌────────┐  ┌─────────┐  ┌─────────────┐
│SQLite  │ │Arkiv   │  │ Paseo   │  │Polkassembly │
│Database│ │Network │  │AssetHub │  │     API     │
└────────┘ └────────┘  └─────────┘  └─────────────┘
```

## File Structure

```
frontend/
├── app/
│   ├── api/
│   │   ├── client.ts      # HTTP client for backend API
│   │   └── types.ts       # TypeScript types for API responses
│   ├── hooks/
│   │   └── useProposals.ts  # React Query hooks
│   └── components/
│       ├── ProposalList.tsx    # List view of active proposals
│       └── ProposalDetail.tsx  # Detail view with Arkiv content
└── .env.local              # Environment configuration
```

## API Endpoints

### 1. **GET /proposals**
Get all proposals (paginated)

**Query Parameters:**
- `status` (optional): `pending` | `completed` | `failed`
- `limit` (optional): Number of results (default: 100, max: 1000)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```typescript
Proposal[] // Basic proposal data, NO Arkiv content or vote stats
```

### 2. **GET /proposals/active**
Get proposals with open inscription/voting periods

**Response:**
```typescript
ProposalWithVoteStats[] // Includes vote statistics
```

### 3. **GET /proposals/:id/full**
Get full proposal details with Arkiv content and vote stats

**Response:**
```typescript
ProposalFull {
  // All proposal fields
  arkivContent: string,      // ← Full text from Arkiv
  voteStats: VoteStats       // ← Live voting data
}
```

## Data Flow

### Loading a Proposal Detail Page

```typescript
// 1. Component calls hook
const { data: proposal } = useProposalFull(1);

// 2. Hook uses React Query
queryFn: () => getProposalFull(1)

// 3. Client makes HTTP request
GET http://localhost:8000/proposals/1/full

// 4. Backend fetches data
├── Read from SQLite database
├── Fetch Arkiv content from Arkiv network
└── Query vote stats from Paseo contract

// 5. Response returned to frontend
{
  id: 1,
  polkassemblyTitle: "...",
  arkivContent: "# Full proposal text...",  // ← From Arkiv
  voteStats: {
    enscribedVoters: 0,
    isInscriptionOpen: true,
    // ...
  }
}
```

## React Query Configuration

The hooks use TanStack Query for:

- **Automatic caching** - Proposals cached for 1-5 minutes
- **Background refetching** - Active proposals refetch every minute
- **Error handling** - Automatic retry with exponential backoff
- **Loading states** - Built-in loading/error states

Example hook:

```typescript
export function useProposalFull(id: number) {
  return useQuery({
    queryKey: ['proposal', id, 'full'],
    queryFn: () => getProposalFull(id),
    staleTime: 1000 * 60,           // 1 minute cache
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
}
```

## Component Usage

### ProposalList Component

Displays all active proposals with vote progress:

```tsx
import ProposalList from './components/ProposalList';

<ProposalList onSelectProposal={(id) => setSelectedId(id)} />
```

**Features:**
- Shows inscription/voting status badges
- Progress bars for voter inscription
- Click to navigate to detail view
- Auto-refreshes every minute

### ProposalDetail Component

Shows full proposal with Arkiv content:

```tsx
import ProposalDetail from './components/ProposalDetail';

<ProposalDetail proposalId={1} />
```

**Features:**
- Displays full Arkiv content (markdown formatted)
- Real-time vote statistics
- Links to Polkassembly and Arkiv
- Voting progress visualization
- Final vote result display

## Environment Configuration

**`.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Production:**
```bash
NEXT_PUBLIC_API_URL=https://api.yourproduction.com
```

## Data Types

### Proposal
Basic proposal metadata from database:

```typescript
interface Proposal {
  id: number;
  polkassemblyId: number;
  polkassemblyTitle: string;
  polkassemblyContent: string;  // Original Polkassembly content
  arkivCid: string;              // Arkiv entity key
  arkivUrl: string;              // Direct link to Arkiv
  paseoVoteContractAddress: string;
  // ... more fields
}
```

### VoteStats
Live voting data from Paseo contracts:

```typescript
interface VoteStats {
  enscribedVoters: number;      // How many voters registered
  votedVoters: number;          // How many actually voted
  maximalNumberOfVoters: number; // Max allowed voters
  yesVotes: number;             // Number of yes votes
  finalVote: boolean | null;    // Final result (when finalized)
  voters: Array<{
    address: string;
    hasVoted: boolean;
  }>;
  isInscriptionOpen: boolean;   // Can still inscribe?
  isVotingOpen: boolean;        // Can still vote?
  isFinalized: boolean;         // Vote concluded?
}
```

### ProposalFull
Complete proposal with Arkiv content:

```typescript
interface ProposalFull extends Proposal {
  arkivContent: string;  // ← Full markdown text from Arkiv
  voteStats: VoteStats;  // ← Live voting statistics
}
```

## Error Handling

All components handle three states:

```tsx
const { data, isLoading, error } = useProposalFull(id);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error.message} />;
return <ProposalView data={data} />;
```

## Performance Optimizations

1. **Stale-While-Revalidate**: Shows cached data while fetching fresh data
2. **Automatic Refetching**: Active proposals update every minute
3. **Query Deduplication**: Multiple components requesting same data share request
4. **Pagination**: Limit results to prevent large payloads

## Testing the Integration

### 1. Start the Backend

```bash
cd opengov-mirror-server
npm run dev
# Server running on http://localhost:8000
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
# Frontend running on http://localhost:3000
```

### 3. Verify Connection

Open browser console and check:
- No CORS errors
- Network tab shows successful API requests
- Proposals load with real data from backend

### 4. Test Proposal Detail

Click on a proposal card to verify:
- Arkiv content displays correctly
- Vote statistics show real-time data
- Links to Polkassembly and Arkiv work

## Troubleshooting

### CORS Errors

Backend already configured with CORS middleware accepting all origins. If you see CORS errors:

1. Check backend is running
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check backend logs for errors

### No Data Loading

1. Check backend has proposals: `curl http://localhost:8000/proposals`
2. Check backend sync status: `curl http://localhost:8000/health/detailed`
3. Trigger manual sync: `curl -X POST http://localhost:8000/sync`

### Stale Data

React Query caches aggressively. To force refresh:
- Hard reload browser (Cmd/Ctrl + Shift + R)
- Clear React Query cache in React DevTools
- Reduce `staleTime` in hooks during development

## Next Steps

### Add Voting Functionality

The components display vote stats but don't handle voting yet. To add:

1. Import vote contract ABI
2. Use wagmi hooks for contract interaction
3. Add "Inscribe" and "Vote" buttons to ProposalDetail
4. Integrate ZK proof generation for anonymous voting

### Add Routing

Currently uses state for navigation. Consider:

- Next.js App Router with dynamic routes
- URL: `/proposals/:id` instead of state management
- Better browser back/forward support

### Add Search/Filters

- Filter by track
- Search by title/content
- Filter by voting status

## Additional Resources

- [Backend API Documentation](../opengov-mirror-server/API_DOCUMENTATION.md)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
