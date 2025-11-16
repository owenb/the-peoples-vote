# 🚀 Quick Start Testing Guide

## Prerequisites (5 minutes)

1. **Backend must be running:**
   ```bash
   cd opengov-mirror-server
   python main.py
   # Should be running on http://localhost:8000
   ```

2. **Install frontend dependencies:**
   ```bash
   cd the-peoples-vote/frontend
   npm install
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   # Opens at http://localhost:3000
   ```

4. **Wallet Setup:**
   - Install MetaMask or SubWallet browser extension
   - Add Paseo Asset Hub network:
     - Network Name: `Paseo Asset Hub`
     - RPC URL: `https://testnet-passet-hub-eth-rpc.polkadot.io`
     - Chain ID: `420420422`
     - Symbol: `PAS`
   - Get test tokens from faucet (if needed)

---

## Test Flow (10 minutes)

### Step 1: Open the App
```bash
Open browser → http://localhost:3000
```

**You should see:**
- "The People's Vote" header
- Connect wallet button
- List of proposals (if backend has data)

### Step 2: Connect Wallet
1. Click "Connect Wallet" button
2. Approve connection in wallet popup
3. **Verify:** Wallet address appears in header

### Step 3: Open a Proposal
1. Click on any proposal in the list
2. **You should see:**
   - Proposal title and content
   - Vote Status card on right sidebar
   - Voter statistics (inscribed, votes cast)
   - "Register to Vote" button (if not registered)

### Step 4: Register to Vote ⭐ CRITICAL TEST
1. Click "Register to Vote" button
2. **Watch the logs appear:**
   ```
   🔐 Starting voter registration...
   🎲 Generating random value...
   🔒 Encrypting random value...
   ⚙️ Generating zero-knowledge proof...
     Compiling circuit...
     Proving...
   ✅ Proof generated (XXX bytes)
   📤 Submitting registration to blockchain...
   ```
3. **Wallet popup appears** - Approve the transaction
4. **Wait for confirmation:**
   ```
   ✅ Transaction sent: 0xabc...def
   ⏳ Waiting for confirmation...
   ✅ Confirmed in block 12345
   🎉 Registration complete!
   ```
5. **UI should auto-update:**
   - ✅ "You're Registered" badge appears
   - ✅ "Register" button disappears
   - ✅ "Vote Yes" and "Vote No" buttons appear
   - ✅ Voter count increases by 1

**If this works, the integration is successful! 🎉**

### Step 5: Cast Your Vote ⭐ CRITICAL TEST
1. Click either "Vote Yes" or "Vote No" button
2. **Watch the logs:**
   ```
   🗳️ Starting vote submission (YES/NO)...
   🔒 Encrypting vote...
   ⚙️ Generating zero-knowledge proof...
   🔍 Verifying proof inputs...
   ✅ Proof inputs verified
   📤 Submitting vote to blockchain...
   ```
3. **Approve transaction in wallet**
4. **Wait for confirmation:**
   ```
   ✅ Transaction sent: 0xabc...def
   ⏳ Waiting for confirmation...
   ✅ Confirmed in block 12346
   🎉 Vote submitted successfully!
   ```
5. **UI should auto-update:**
   - ✅ "You Voted" badge appears
   - ✅ Vote buttons disappear
   - ✅ Votes cast count increases
   - ✅ Your address shows "✓ Voted" in voters list

**If this works, voting is functional! 🎉**

---

## ✅ Success Checklist

After testing, you should be able to check all these boxes:

- [ ] Frontend starts without errors
- [ ] Proposals load from backend
- [ ] Can connect wallet
- [ ] Proposal details display correctly
- [ ] Can click "Register to Vote"
- [ ] Proof generation logs appear
- [ ] Wallet popup appears for registration
- [ ] Transaction confirms successfully
- [ ] UI updates after registration (badge, buttons change)
- [ ] Can click "Vote Yes" or "Vote No"
- [ ] Vote proof generation works
- [ ] Vote transaction confirms
- [ ] UI updates after vote (badge, count increases)
- [ ] Voter list shows current user as voted

---

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"
**Solution:** Check backend is running on http://localhost:8000
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok",...}
```

### Error: "No proposals found"
**Solution:** Backend needs to scrape data first
```bash
curl -X POST http://localhost:8000/sync
# Wait a few seconds, then refresh frontend
```

### Error: "Wrong network"
**Solution:** Switch wallet to Paseo Asset Hub
- Network: Paseo Asset Hub
- Chain ID: 420420422
- RPC: https://testnet-passet-hub-eth-rpc.polkadot.io

### Error: "Transaction failed"
**Solutions:**
1. Check you have PAS tokens for gas
2. Check network connection
3. Try refreshing the page and reconnecting wallet

### Proof Generation Takes Forever
**Expected:** Proof generation can take 30-60 seconds (this is normal for ZK proofs!)
**Watch the logs** - you'll see progress messages

### UI Doesn't Update After Transaction
**Solution:**
1. Try manually refreshing the page
2. Check browser console for errors
3. Verify transaction actually confirmed (check block explorer)

---

## 📊 What to Look For

### Good Signs ✅
- ✅ Logs appear showing each step
- ✅ Wallet popup appears when expected
- ✅ Transaction shows "pending" then "confirmed"
- ✅ UI updates automatically without refresh
- ✅ Voter counts increase correctly
- ✅ Badges appear showing your status

### Bad Signs ❌
- ❌ No logs appear when clicking buttons
- ❌ Wallet popup never appears
- ❌ Transaction stays "pending" forever
- ❌ UI doesn't update after transaction
- ❌ Console shows errors
- ❌ Buttons don't change after actions

---

## 🎯 Expected Performance

| Action | Expected Time |
|--------|--------------|
| Load proposal | < 2 seconds |
| Connect wallet | < 5 seconds |
| Proof generation | 30-60 seconds |
| Transaction submission | 5-15 seconds |
| UI update | Immediate |

---

## 📸 Screenshots to Verify

Take screenshots of:
1. **Before registration:** Register button visible
2. **During registration:** Transaction logs showing proof generation
3. **After registration:** "You're Registered" badge, vote buttons visible
4. **During vote:** Proof generation logs
5. **After vote:** "You Voted" badge, voter list updated

---

## 🆘 Need Help?

If you're stuck:

1. **Check browser console** (F12 → Console tab)
2. **Check network tab** (F12 → Network tab)
3. **Check backend logs** (terminal running main.py)
4. **Read MIGRATION_COMPLETE.md** for detailed architecture

---

## 🎉 Success!

If you can successfully:
1. ✅ Register to vote
2. ✅ Cast a vote
3. ✅ See UI update automatically

**The migration is working perfectly!** 🚀

You now have a fully functional ZK voting app with:
- Backend API integration
- Blockchain smart contracts
- Zero-knowledge proofs
- Beautiful UI
- Real-time updates

**Next steps:**
- Test with multiple users
- Test edge cases (already voted, voting complete, etc.)
- Deploy to production!

---

*Last updated: November 16, 2025*
