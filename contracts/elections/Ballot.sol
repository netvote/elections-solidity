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

import "../links/PoolRegistry.sol";
import "../lib/Bytes32Set.sol";
import "./Election.sol";
import "./RegistrationPool.sol";


contract Ballot is PoolRegistry {
    using Bytes32Set for Bytes32Set.SetData;

    // events
    event BallotVote(address pool, address voter);

    bytes32 constant GROUP_ALL = "ALL";

    // configuration
    Bytes32Set.SetData groupSet;
    mapping (bytes32 => AddressSet.SetData) groupPoolSet;
    Election public election;
    string public metadataLocation;

    // state
    // map of voters to prevent duplicates
    mapping (address => bool) voterVoted;

    // pools to the list of voters
    mapping (address => address[]) poolVoters;

    function Ballot(address electionAddress, address ownerAddress, string location) public {
        require(electionAddress != address(0));
        election = Election(electionAddress);
        owner = ownerAddress;
        metadataLocation = location;
        groupSet.put(GROUP_ALL);
    }

    modifier validPool() {
        require(poolSet.contains(msg.sender));
        _;
    }

    function setMetadataLocation(string location) public building admin {
        metadataLocation = location;
    }

    function groupPoolCount(bytes32 group) constant public returns (uint256) {
        return groupPoolSet[group].size();
    }

    function getGroupPool(bytes32 group, uint256 index) constant public returns (address) {
        return groupPoolSet[group].getAt(index);
    }

    function getPoolVoterCount(address pool) constant public returns(uint256) {
        return poolVoters[pool].length;
    }

    // gets voter address by pool and index (for iteration)
    function getPoolVoter(address pool, uint256 i) constant public returns(address) {
        return poolVoters[pool][i];
    }

    function addPool(address p) public building admin {
        super.addPool(p);
        addPoolToGroup(p, GROUP_ALL);
    }

    function checkElection() public constant returns (bool) {
        return election != address(0) && election.ballotExists(this);
    }

    function checkPools() public constant returns (bool) {
        // there must be at least one pool set
        if (poolSet.size() == 0) {
            return false;
        }
        for (uint256 i = 0; i<poolSet.size(); i++) {
            // pool must reference this ballot
            if (!RegistrationPool(poolSet.getAt(i)).ballotExists(this)) {
                return false;
            }
            // pool must point to same election
            if (RegistrationPool(poolSet.getAt(i)).election() != election) {
                return false;
            }
            // election has the pool
            if (!election.poolExists(poolSet.getAt(i))) {
                return false;
            }
            //TODO: check that pool has group assigned
        }
        return true;
    }

    function checkConfig() public constant returns (bool) {
        return checkElection() && checkPools();
    }

    function getGroupCount() constant public returns (uint256) {
        return groupSet.size();
    }

    function getGroup(uint256 index) constant public returns (bytes32) {
        return groupSet.getAt(index);
    }

    function removeGroup(bytes32 group) public building admin {
        groupSet.remove(group);
    }

    function addGroup(bytes32 group) public building admin {
        groupSet.put(group);
    }

    function addPoolToGroup(address pool, bytes32 group) public building admin {
        require(groupSet.contains(group));
        require(poolSet.contains(pool));
        groupPoolSet[group].put(pool);
    }

    function castVote(address voter) public voting validPool {
        require(!voterVoted[voter]);
        voterVoted[voter] = true;
        poolVoters[msg.sender].push(voter);
        BallotVote(msg.sender, voter);
    }
}