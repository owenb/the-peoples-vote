# Setup Instructions for Polkadot Address Mapping

## Quick Start

### 1. Install Dependencies

Dependencies have already been installed. If you need to reinstall:

```bash
npm install
```

The following Polkadot.js packages were added:
- `@polkadot/api` - Polkadot API for runtime calls
- `@polkadot/util` - Utility functions
- `@polkadot/util-crypto` - Cryptographic utilities
- `@polkadot/extension-dapp` - Browser extension integration
- `@polkadot/extension-inject` - Extension types

### 2. Configure Environment Variables

Create or update `.env.local` in the `frontend` directory:

```bash
# Vote Contract Address (update with your deployed contract)
NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS=0x1a3d10C62E8b1bC6B4CfCE86d46A81f66F7f4089

# WalletConnect Project ID (for RainbowKit)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Enable testnets (optional)
NEXT_PUBLIC_ENABLE_TESTNETS=true
```

### 3. Usage in Your Application

#### Option A: Use the Complete Voting Component

Replace your existing voting component with the integrated Polkadot voting:

```tsx
// app/page.tsx
import PolkadotVotingExample from './components/PolkadotVotingExample';

export default function Page() {
  return <PolkadotVotingExample />;
}
```

#### Option B: Use Individual Components

Integrate piece by piece into your existing UI:

```tsx
import { PolkadotWalletButton } from './components/PolkadotWalletButton';
import { AccountMappingPrompt } from './components/AccountMappingPrompt';
import { usePolkadotWallet } from './hooks/usePolkadotWallet';
import { useAccountMapping } from './hooks/useAccountMapping';

function MyComponent() {
  const { selectedAccount } = usePolkadotWallet();
  const { mappingStatus } = useAccountMapping(selectedAccount);

  return (
    <div>
      <PolkadotWalletButton />
      {selectedAccount && <AccountMappingPrompt account={selectedAccount} />}
    </div>
  );
}
```

### 4. Update Your Contract Address

Once you deploy your Vote contract to Paseo Asset Hub, update the environment variable:

```bash
NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS=0xYourContractAddress
```

Or update directly in `app/utils/contract-interaction.ts`:

```typescript
const VOTE_CONTRACT_ADDRESS = '0xYourContractAddress';
```

## Files Created

### Utilities
- `app/utils/polkadot-revive.ts` - Address mapping and conversion
- `app/utils/contract-interaction.ts` - Smart contract interactions

### Hooks
- `app/hooks/usePolkadotWallet.ts` - Wallet connection management
- `app/hooks/useAccountMapping.ts` - Account mapping state

### Components
- `app/components/PolkadotWalletButton.tsx` - Wallet connection UI
- `app/components/AccountMappingPrompt.tsx` - Mapping prompt UI
- `app/components/PolkadotVoting.tsx` - Integrated voting interface
- `app/components/PolkadotVotingExample.tsx` - Complete example page

### Documentation
- `POLKADOT_ADDRESS_MAPPING_GUIDE.md` - Comprehensive guide
- `SETUP_INSTRUCTIONS.md` - This file

## Testing

### 1. Install a Polkadot Wallet Extension

Install one of these browser extensions:
- [Talisman](https://talisman.xyz/)
- [SubWallet](https://subwallet.app/)
- [Polkadot.js Extension](https://polkadot.js.org/extension/)

### 2. Create a Test Account

Create a new account in your wallet extension for testing.

### 3. Get Test Tokens

Visit the [Paseo Faucet](https://faucet.polkadot.io/) to get PAS test tokens.

### 4. Test the Flow

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to your voting page

3. Click "Connect Polkadot Wallet"

4. Select your account

5. If prompted, map your account (one-time operation)

6. Cast a test vote

## Common Issues

### "No Polkadot wallet extension found"

**Solution**: Install Talisman, SubWallet, or Polkadot.js extension and refresh the page.

### "No accounts found"

**Solution**: Create an account in your wallet extension.

### Account mapping fails

**Solution**: Ensure your account has sufficient PAS tokens for gas fees.

### Contract calls fail

**Solutions**:
1. Verify the contract address in `.env.local`
2. Ensure your account is mapped
3. Check that the contract is deployed on Paseo Asset Hub
4. Verify you have gas tokens

### Types errors in TypeScript

**Solution**: Run `npm run build` to check for type errors. The Polkadot.js types should be automatically included.

## Development Workflow

### 1. Local Development

```bash
npm run dev
```

Access at `http://localhost:3000`

### 2. Build for Production

```bash
npm run build
npm start
```

### 3. Linting

```bash
npm run lint
```

## Integration with Existing Code

### If you have existing wallet connection (Wagmi/RainbowKit)

You can run both Ethereum and Polkadot wallet connections side-by-side:

```tsx
import { ConnectButton } from '@rainbow-me/rainbowkit'; // Ethereum
import { PolkadotWalletButton } from './components/PolkadotWalletButton'; // Polkadot

function Header() {
  return (
    <div className="flex gap-4">
      <ConnectButton /> {/* For Ethereum interactions */}
      <PolkadotWalletButton /> {/* For Polkadot interactions */}
    </div>
  );
}
```

### If you need to customize the UI

All components use Tailwind CSS and the Handjet monospace font to match your existing design. You can easily customize:

```tsx
// Customize colors
<button className="bg-gradient-to-r from-[#YOUR-COLOR] to-[#YOUR-COLOR]">
  Connect
</button>

// Customize fonts
<div style={{ fontFamily: 'Your-Font, monospace' }}>
  Content
</div>
```

## Next Steps

1. ✅ Install dependencies (completed)
2. ✅ Create utility functions (completed)
3. ✅ Create React hooks (completed)
4. ✅ Create UI components (completed)
5. ⏳ Set environment variables
6. ⏳ Deploy your Vote contract
7. ⏳ Update contract address
8. ⏳ Test the integration
9. ⏳ Deploy to production

## Resources

- [Polkadot.js Documentation](https://polkadot.js.org/docs/)
- [pallet-revive Documentation](https://paritytech.github.io/polkadot-sdk/master/pallet_revive/)
- [Paseo Network](https://github.com/paseo-network)
- [Account Mapping Guide](./POLKADOT_ADDRESS_MAPPING_GUIDE.md)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your wallet extension is unlocked
3. Ensure you're connected to Paseo Asset Hub network
4. Review the comprehensive guide: `POLKADOT_ADDRESS_MAPPING_GUIDE.md`

## Advanced Configuration

### Custom RPC Endpoints

You can configure custom RPC endpoints in `app/utils/polkadot-revive.ts`:

```typescript
const PASEO_ASSET_HUB_WS = 'wss://your-custom-rpc.io';
```

### Contract ABI Updates

If you modify your Vote contract, update the ABI file:

```bash
# Copy new ABI from your contract build
cp path/to/Vote.abi.json opengov-mirror-server/src/contracts/
```

### TypeScript Configuration

The project uses strict TypeScript. If you need to adjust:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true
  }
}
```
