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

pragma solidity ^0.4.17;

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

    // prevents duplicate JTIs
    mapping (bytes32 => bool) jtiMap;

    address public gateway;

    function BasePool(bytes32 hashedUserId, address el, address gw) public {
        require(el != address(0) && gw != address(0));
        addAuthorized(hashedUserId);
        election = el;
        gateway = gw;
    }

    modifier onlyGateway() {
        require(msg.sender == gateway);
        _;
    }

    modifier notDuplicateJti(bytes32 jti) {
        require(!jtiMap[jti]);
        _;
    }

    // avoids allowing a duplicate vote
    modifier notDuplicate(bytes32 voteId) {
        require(!voteIdSet.contains(voteId));
        _;
    }

    // checks election to see if updates to votes are allowed
    modifier updatesAllowed() {
        require(BaseElection(election).allowVoteUpdates());
        _;
    }

    // returns number of voteIds voted (for iteration of votes)
    function getVoteCount() public constant returns (uint256) {
        return voteIdSet.size();
    }

    // returns number of voteIds voted (for iteration of votes)
    function getVoteAt(uint256 index) public constant returns (string) {
        return votes[voteIdSet.getAt(index)];
    }

    // store vote
    function castVote(
        bytes32 voteId,
        string vote,
        string passphrase,
        bytes32 jti) public voting onlyGateway notDuplicate(voteId) notDuplicateJti(jti)
    {
        jtiMap[jti] = true;
        voteIdSet.put(voteId);
        votes[voteId] = vote;
        BaseElection(election).deductVote();
        Vote(voteId);
    }

    // voter can update their vote if election allows it
    function updateVote(
        bytes32 voteId,
        string vote,
        string passphrase,
        bytes32 jti) public voting onlyGateway updatesAllowed notDuplicateJti(jti)
    {
        require(voteIdSet.contains(voteId));
        jtiMap[jti] = true;
        votes[voteId] = vote;
        UpdateVote(voteId);
    }
}