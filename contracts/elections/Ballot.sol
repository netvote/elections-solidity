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

import "../base/PoolRegistry.sol";

contract Ballot is PoolRegistry {
    address public election;
    event BallotVote(address pool, address voter);

    string public metadataLocation;

    // map of voters to prevent duplicates
    mapping (address => bool) voterVoted;

    // pools to the list of voters
    mapping (address => address[]) poolVoters;

    // maps groups to pools to determine whether the pool should be counted for group
    mapping (address => mapping(string => bool)) poolGroupMapping;

    // result groups for ballot (e.g., NY, District 6, etc...)
    mapping (string => bool) internal groupExists;
    mapping (string => uint256) internal groupIndex;
    string[] public groups;

    function Ballot(address electionAddress, address ownerAddress, string location) public {
        election = electionAddress;
        owner = ownerAddress;
        metadataLocation = location;
    }

    modifier validPool() {
        require(poolSet.contains(msg.sender));
        _;
    }

    function setMetadataLocation(string location) public building admin {
        metadataLocation = location;
    }

    function collectPoolsByGroup(string group) constant internal returns (address[]) {
        address[] memory res = new address[](poolSet.size());
        uint256 count = 0;
        for (uint256 i = 0; i<poolSet.size(); i++) {
            address pool = poolSet.getAt(i);
            if (poolGroupMapping[pool][group]) {
                res[i] = pool;
                count++;
            }
        }
        address[] memory pruned = new address[](count);
        uint256 index = 0;
        for (uint256 j = 0; j<res.length; j++) {
            if (res[j] != address(0)) {
                pruned[index] = res[j];
                index++;
            }
        }
        return pruned;
    }

    function groupPoolCount(string group) constant public returns (uint256) {
        address[] memory res = collectPoolsByGroup(group);
        return res.length;
    }

    function getGroupPool(string group, uint256 index) constant public returns (address) {
        address[] memory res = collectPoolsByGroup(group);
        return res[index];
    }

    function getPoolVoterCount(address pool) constant public returns(uint256) {
        return poolVoters[pool].length;
    }

    // gets voter address by pool and index (for iteration)
    function getPoolVoter(address pool, uint256 i) constant public returns(address) {
        return poolVoters[pool][i];
    }

    function checkConfig() public constant returns (bool) {
        //TODO: implement
        return true;
    }

    // internal method for getting groups that have not been removed to make indexes work
    function getPrunedGroups() constant internal returns (string[]) {
        string[] memory res = new string[](groups.length);
        uint256 count = 0;
        for (uint256 i = 0; i<groups.length; i++) {
            if (groupExists[groups[i]]) {
                res[i] = groups[i];
                count++;
            }
        }
        string[] memory pruned = new string[](count);
        uint256 index = 0;
        for (uint256 j = 0; j<res.length; j++) {
            if (bytes(res[j]).length > 0) {
                pruned[index] = res[j];
                index++;
            }
        }
        return pruned;
    }

    function getGroupCount() constant public returns (uint256) {
        return getPrunedGroups().length;
    }

    function getGroup(uint256 index) constant public returns (string) {
        return getPrunedGroups()[index];
    }

    function removeGroup(string group) public building admin {
        require(groupExists[group]);
        delete groupExists[group];
        delete groups[groupIndex[group]];
        delete groupIndex[group];
    }

    function addGroup(string group) public building admin {
        require(!groupExists[group]);
        groupExists[group] = true;
        groups.push(group);
        groupIndex[group] = groups.length - 1;
    }

    function addPoolToGroup(address pool, string group) public building admin {
        require(groupExists[group]);
        require(poolSet.contains(pool));
        require(!poolGroupMapping[pool][group]);
        poolGroupMapping[pool][group] = true;
    }

    function castVote(address voter) public voting validPool {
        require(!voterVoted[voter]);
        voterVoted[voter] = true;
        poolVoters[msg.sender].push(voter);
        BallotVote(msg.sender, voter);
    }
}