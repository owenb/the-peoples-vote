// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import {Vote} from "./Vote.sol";
import {IVerifier as IInscriptionVerifier} from "./InscriptionVerifier.sol";
import {IVerifier as IVotingVerifier} from "./VotingVerifier.sol";

contract VoteFactory is Ownable {
    IInscriptionVerifier public defaultInscriptionVerifier;
    IVotingVerifier public defaultVotingVerifier;
    bytes32 public generator;

    address[] private _votes;
    string[] private _voteNames;
    string[] private _voteDescriptions;
    uint256[] private _numberOfVoters;

    event VoteCreated(
        uint256 indexed id,
        address indexed vote,
        uint256 numberOfVoters,
        bytes32 generator,
        string name,
        string description
    );

    error Vote__InvalidVoteId(uint256 voteId, uint256 totalVotes);

    constructor(
        IInscriptionVerifier _inscriptionVerifier,
        IVotingVerifier _votingVerifier,
        bytes32 _generator
    ) Ownable(msg.sender) {
        defaultInscriptionVerifier = _inscriptionVerifier;
        defaultVotingVerifier = _votingVerifier;
        generator = _generator;
    }

    /// @notice Create a Vote and store its human metadata
    function createVote(
        string calldata name,
        string calldata description,
        uint256 numberOfVoters
    ) external returns (address voteAddr, uint256 id) {
        Vote vote = new Vote(
            defaultInscriptionVerifier,
            defaultVotingVerifier,
            numberOfVoters,
            generator
        );
        voteAddr = address(vote);
        _votes.push(voteAddr);
        _voteNames.push(name);
        _voteDescriptions.push(description);
        _numberOfVoters.push(numberOfVoters);
        id = _votes.length - 1;

        emit VoteCreated(id, voteAddr, numberOfVoters, generator, name, description);
    }

    /// @notice Get the Vote contract address by its id
    function getById(uint256 id) external view returns (address) {
        if (id >= _votes.length) {
            revert Vote__InvalidVoteId(id, _votes.length);
        }
        return _votes[id];
    }

    /// @notice Get vote name & description
    function getMetadata(uint256 id) external view returns (string memory name, string memory description, uint256 numberOfVoters) {
        if (id >= _votes.length) {
            revert Vote__InvalidVoteId(id, _votes.length);
        }
        return (_voteNames[id], _voteDescriptions[id], _numberOfVoters[id]);
    }

    /// @notice Total number of votes created
    function totalVotes() external view returns (uint256) {
        return _votes.length;
    }

    /// @notice Optional: update default verifiers
    function setDefaultVerifiers(
        IInscriptionVerifier _inscriptionVerifier,
        IVotingVerifier _votingVerifier
    ) external onlyOwner {
        defaultInscriptionVerifier = _inscriptionVerifier;
        defaultVotingVerifier = _votingVerifier;
    }

    /// @notice Optional: return all vote addresses
    function listVotes() external view returns (address[] memory) {
        return _votes;
    }
}
