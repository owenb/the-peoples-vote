# Open Vote Contracts

# Forge Dependencies Setup
``` bash
forge install openzeppelin/openzeppelin-contracts
```

``` bash
forge remappings > remappings.txt
```

## Deployment
```bash
forge script script/DeployOVFactory.s.sol:DeployOVFactory \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

``` bash
forge script script/DeployOVFactory.s.sol:DeployOVFactory \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --optimize \
  --optimizer-runs 200 \
  -vvvv
```