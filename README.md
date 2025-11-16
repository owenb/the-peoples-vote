# The People's Vote

We want to recognise the time, money and effort that people spend travelling to Polkadot events, or attending local meetups, by giving them a voice on OpenGov - even if they don’t own any DOT.

The core engine of the project is a cryptographically anonymous voting protocol, that is preserving privacy across all technical layers - from theoretical foundations to implementation and networking.

For Milestone 2 we plan to combine this with a probabilistic proof of personhood which is a function of the number of IRL Polkadot events a person attends. We can use Luma QR ticket codes and NFC to ensure we allow only one account per person.

## Introduction
A prominent problem with decentralized voting protocols today, is that all referendum votes are fully public, which makes individual voters vulnerable to external pressure, coercion, or retaliation. When others can verify how you voted, they can influence you through social pressure—forcing you to act in their interests. Zero-knowledge proofs solve this by allowing a voter to prove that their vote was valid and included in the final tally without revealing the vote itself or their stake. This brings true anonymity to decentralized on chain voting, making it infeasible for any third party to confirm or credibly threaten based on an individual’s vote, thus restoring independence and integrity to the decision-making process.

## Cryptography
By leveraging modern cryptographic methods, such as Zero-Knowledge (ZK) proofs, the proposed protocol imitates the same behavior as the original OpenGov protocol. It’s been deliberately decided not to use Trusted Execution Environment (TEE), as it is not secure inherently. Multiparty Computation (MPC) is also not explored in this proposal as it is complicated to ensure security guarantees as it requires non-colution of the MPC parties, which cannot be proven mathematically but has to be based on trust only.

## Networking
XX network offers strong privacy on the network level by routing messages through a global mixnet that strips away metadata such as IP addresses, device details, and timestamps. As a result, users gain a high level of anonymity and protection, which makes the XX network an interesting use case for voting - ensuring that the messages on the networking level won’t leak information about the voters and their votes.
Decentralization and Arkiv
The application is fully decentralized
All the proposals’ descriptions are stored in Arkiv, using a smart contract on Polkadot we link to the corresponding description .

## Result
A fully private protocol in all the technical levels, starting from the on-chain anonymous logic all the way to obfuscated anonymity in the networking layer (due to the utilization of the XX Network).

## Achievements
Integrated Arkiv for complete decentralized storge
Deployed ZK verifier contracts on Asset Hub!
Integrated XX-network’s mixer to provide networking layer protection (e2e protected)

## Milestone 2

1. Implementing Proof of personhood by scanning the luma (QR) ticket, and using the event id and the guest id, to give an opportunity to vote once (and only once)
2. Explore use of NFC wrist bands
3. Improve Front End and UX
4. Store ZK proofs on Arkiv


**Track:** [X ] SHIP-A-TON [ ] IDEA-TON  
### Features We'll Build - 6 Weeks
**Week 1-2:**
- Feature: Implementing Proof of personhood by scanning the luma (QR) ticket, and using the event id and the guest id,  to give an opportunity to vote once (and only once).
- Why it matters: Introduces the ability to ensure one-person-one-vote property
- Who builds it: All

**Week 2-3:**
- Feature: Explore use of NFC wrist bands
- Why it matters: It’s cool, and it’s great UX.
- Who builds it: All

**Week 3-4:**
- Feature: Improve Front End and UX - exploring animation, slick designs and efficient ZK schemes (browser-friendly)
- Why it matters: UX.
- Who builds it: All

**Week 5-6:**
- Feature: Store ZK proofs on Arkiv - a ZK proof can take up to 16Kb of storage. Arkiv can provide a cheap storage solution.
- Why it matters: UX.
- Who builds it: All
