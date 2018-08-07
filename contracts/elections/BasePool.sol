// ------------------------------------------------------------------------------
// This file is part of netvote.
//
// netvote is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// netvote is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with solidity.  If not, see <http://www.gnu.org/licenses/>
//
// (c) 2017 netvote contributors.
//------------------------------------------------------------------------------

pragma solidity ^0.4.24;

import "./BaseElection.sol";
import "./links/BallotRegistry.sol";
import "../auth/ExternalAuthorizable.sol";
import "../lib/NoRemovalBytes32Set.sol";


/**
 * @title BasePool
 * @dev A base contract receives and stores votes from a gateway address.
 * This maps a set of ballots for the purposes of ballot iteration.
 */
contract BasePool is ExternalAuthorizable, BallotRegistry {
    using NoRemovalBytes32Set for NoRemovalBytes32Set.SetData;

    NoRemovalBytes32Set.SetData voteIdSet;

    address public election;
    string public createdBy;

    // events
    event Vote(bytes32 voteId);
    event UpdateVote(bytes32 voteId);

    // voteId to vote map
    mapping (bytes32 => string) public votes;

    // voteId to proof 
    mapping (bytes32 => string) public proofs;

    // prevents duplicate JTIs
    mapping (bytes32 => bool) jtiMap;

    bool storeProofs;

    address public gateway;

    constructor (bytes32 hashedUserId, address el, address gw) public {
        require(el != address(0) && gw != address(0), "Gateway must be specified");
        addAuthorized(hashedUserId);
        election = el;
        gateway = gw;
    }

    modifier onlyGateway() {
        require(msg.sender == gateway, "Only the gateway may cast votes");
        _;
    }

    modifier notDuplicateJti(bytes32 jti) {
        require(!jtiMap[jti], "Token has already been used");
        _;
    }

    // avoids allowing a duplicate vote
    modifier notDuplicate(bytes32 voteId) {
        require(!voteIdSet.contains(voteId), "Voter has already voted and is trying to vote");
        _;
    }

    // checks election to see if updates to votes are allowed
    modifier updatesAllowed() {
        require(BaseElection(election).allowVoteUpdates(), "Election does not allow updates");
        _;
    }

    function setStoreProofs(bool store) public onlyGateway building {
        storeProofs = store;
    }

    // returns number of voteIds voted (for iteration of votes)
    function getVoteCount() public view returns (uint256) {
        return voteIdSet.size();
    }

    // returns number of voteIds voted (for iteration of votes)
    function getVoteAt(uint256 index) public view returns (string) {
        return votes[voteIdSet.getAt(index)];
    }

    // store vote
    function castVote(
        bytes32 voteId,
        string vote,
        string proof,
        bytes32 jti) public voting onlyGateway notDuplicate(voteId) notDuplicateJti(jti)
    {
        jtiMap[jti] = true;
        voteIdSet.put(voteId);
        votes[voteId] = vote;
        if (storeProofs) {
            proofs[voteId] = proof;
        }
        BaseElection(election).deductVote();
        emit Vote(voteId);
    }

    // voter can update their vote if election allows it
    function updateVote(
        bytes32 voteId,
        string vote,
        string proof,
        bytes32 jti) public voting onlyGateway updatesAllowed notDuplicateJti(jti)
    {
        require(voteIdSet.contains(voteId), "Voter has not voted and is trying to update");
        jtiMap[jti] = true;
        votes[voteId] = vote;
        if (storeProofs) {
            proofs[voteId] = proof;
        }
        emit UpdateVote(voteId);
    }
}