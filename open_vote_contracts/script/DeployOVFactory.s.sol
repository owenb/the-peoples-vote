// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {HonkVerifier as InscriptionVerifier} from "../src/InscriptionVerifier.sol";
import {HonkVerifier as VotingVerifier} from "../src/VotingVerifier.sol";
import {VoteFactory} from "../src/VoteFactory.sol";

contract DeployOVFactory is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy shared verifiers once
        InscriptionVerifier inscriptionVerifier = new InscriptionVerifier();
        VotingVerifier votingVerifier = new VotingVerifier();
        bytes32 generator = bytes32(uint256(3));


        // Deploy the factory with default verifiers
        VoteFactory factory = new VoteFactory(
            inscriptionVerifier,
            votingVerifier,
            generator
        );
        factory;

        /*
        uint256 numberOfVoters = 11;
        (address voteAddr, uint256 id) = factory.createVote("Title", "description", numberOfVoters);

        // (Optional) sanity reads so they show up in logs/traces
        address sameAddr = factory.getById(id);
        uint256 count = factory.totalVotes();
        sameAddr; count; voteAddr; // silence warnings
        */
        vm.stopBroadcast();
    }
}
