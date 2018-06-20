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

import "../../lib/Bytes32Set.sol";
import "../links/PoolRegistry.sol";
import "./TieredElection.sol";
import "./TieredPool.sol";
import "../BaseBallot.sol";


/**
 * @title TieredBallot
 * @dev A tiered ballot represents one instance of a ballot in a tiered eleciton.
 * This allows one to partition pools into groups for the purposes of separating votes.
 */
contract TieredBallot is BaseBallot, PoolRegistry {
    using Bytes32Set for Bytes32Set.SetData;

    // events for subscribing to this ballot
    event BallotVote(address pool, bytes32 voteId);

    // default group (popular vote)
    bytes32 constant GROUP_ALL = "ALL";

    // configuration
    Bytes32Set.SetData groupSet;
    mapping (bytes32 => AddressSet.SetData) groupPoolSet;
    mapping (address => Bytes32Set.SetData) poolGroupSet;

    address public election;

    // state
    // map of voters to prevent duplicates
    mapping (bytes32 => bool) voterVoted;

    // pools to the list of voters
    mapping (address => bytes32[]) poolVoters;

    constructor (address electionAddress, address ownerAddress, string location) BaseBallot(ownerAddress, location) public {
        require(electionAddress != address(0));
        election = electionAddress;
        groupSet.put(GROUP_ALL);
    }

    modifier validPool() {
        require(poolSet.contains(msg.sender));
        _;
    }

    function groupPoolCount(bytes32 group) view public returns (uint256) {
        return groupPoolSet[group].size();
    }

    function getGroupPool(bytes32 group, uint256 index) view public returns (address) {
        return groupPoolSet[group].getAt(index);
    }

    function getPoolVoterCount(address pool) view public returns(uint256) {
        return poolVoters[pool].length;
    }

    // gets voter address by pool and index (for iteration)
    function getPoolVoter(address pool, uint256 i) view public returns(bytes32) {
        return poolVoters[pool][i];
    }

    // adds a pool to the ballot
    function addPool(address p) public building admin {
        poolSet.put(p);
        addPoolToGroup(p, GROUP_ALL);
    }

    function checkElection() public view returns (bool) {
        return election != address(0) && TieredElection(election).ballotExists(this);
    }

    function checkPools() public view returns (bool) {
        // there must be at least one pool set
        if (poolSet.size() == 0) {
            return false;
        }
        for (uint256 i = 0; i<poolSet.size(); i++) {
            // pool must reference this ballot
            if (!TieredPool(poolSet.getAt(i)).ballotExists(this)) {
                return false;
            }
            // pool must point to same election
            if (TieredPool(poolSet.getAt(i)).election() != election) {
                return false;
            }
        }
        return true;
    }

    function checkConfig() public view returns (bool) {
        return checkElection() && checkPools();
    }

    function getGroupCount() view public returns (uint256) {
        return groupSet.size();
    }

    function getGroup(uint256 index) view public returns (bytes32) {
        return groupSet.getAt(index);
    }

    function removeGroup(bytes32 group) public building admin {
        groupSet.remove(group);
        for (uint256 i = 0; i<poolSet.size(); i++) {
            address p = poolSet.getAt(i);
            poolGroupSet[p].remove(group);
        }
    }

    function addGroup(bytes32 group) public building admin {
        groupSet.put(group);
    }

    function getPoolGroupCount(address pool) view public returns(uint256) {
        return poolGroupSet[pool].size();
    }

    function getPoolGroupAt(address pool, uint256 index) view public returns(bytes32) {
        return poolGroupSet[pool].getAt(index);
    }

    function addPoolToGroup(address pool, bytes32 group) public building admin {
        require(groupSet.contains(group));
        require(poolSet.contains(pool));
        groupPoolSet[group].put(pool);
        poolGroupSet[pool].put(group);
    }

    function castVote(bytes32 voteId) public voting validPool {
        require(!voterVoted[voteId]);
        voterVoted[voteId] = true;
        poolVoters[msg.sender].push(voteId);
        emit BallotVote(msg.sender, voteId);
    }
}