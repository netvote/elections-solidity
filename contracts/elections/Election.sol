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

import '../ElectionPhaseable.sol';

contract Election is ElectionPhaseable {
    mapping(address => Ballot) ballots;
    mapping(address => uint) ballotIndex;
    address[] ballotList;

    modifier ballotNotExists(address b) {
        require(ballots[msg.sender] == address(0));
        _;
    }

    modifier ballotExists(address b) {
        require(ballots[msg.sender] != address(0));
        _;
    }

    function createBallot(address ownerAddress) public building admin returns (address)  {
        Ballot b = new Ballot(this, ownerAddress);
        ballots[address(b)] = b;
        ballotList.push(address(b));
        return address(b);
    }

    function addBallot(address b) public building admin ballotNotExists(b) {
        require(b != address(0));
        ballots[b] = Ballot(b);
        ballotList.push(b);
        ballotIndex[b] = ballotList.length-1;
    }

    function removeBallot(address b) public building admin ballotExists(b) {
        delete ballots[b];
        delete ballotList[ballotIndex[b]];
        delete ballotIndex[b];
    }
}

contract Ballot is ElectionPhaseable {
    Election election;
    string public metadataLocation;

    // map of voters who have voted (to prevent duplicates)
    mapping (address => bool) voterVoted;

    // map of configured pools (to avoid unauthorized pool interactions)
    mapping (address => bool) poolExists;

    // voters for pool
    mapping (address => address[]) poolVoters;

    mapping (address => PoolGroup) poolGroups;

    address[] internal poolList;
    mapping (address => uint256) poolListIndex;

    struct PoolGroup {
        mapping(string => bool) groupExists;
        string[] groups;
    }

    function Ballot(address e, address ownerAddress) public {
        election = Election(e);
        owner = ownerAddress;
    }

    modifier validPool() {
        require(poolExists[msg.sender]);
        _;
    }

    function setMetadataLocation(string location) public building admin {
        metadataLocation = location;
    }

    function collectPoolsByGroup(string group) constant internal returns (address[]) {
        address[] memory res = new address[](poolList.length);
        uint256 count = 0;
        for (uint256 i =0; i<poolList.length; i++) {
            if (poolExists[poolList[i]]) {
                if(poolGroups[poolList[i]].groupExists[group]){
                    res[i] = poolList[i];
                    count++;
                }
            }
        }
        address[] memory pruned = new address[](count);
        uint256 index = 0;
        for (uint256 j =0; j<res.length; j++) {
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

    function poolCount() constant public returns (uint256) {
        return poolList.length;
    }

    function getPool(uint256 index) constant public returns (address) {
        return poolList[index];
    }

    function getPoolVoterCount(address pool) constant public returns(uint256) {
        return poolVoters[pool].length;
    }

    function getPoolVoter(address pool, uint256 i) constant public returns(address) {
        return poolVoters[pool][i];
    }

    function poolGroupCount(address pool) constant public returns (uint256) {
        return poolGroups[pool].groups.length;
    }

    function getPoolGroup(address pool, uint256 groupIndex) constant public returns (string) {
        require(poolExists[pool]);
        return poolGroups[pool].groups[groupIndex];
    }

    function addPool(address pool) public building admin {
        require(!poolExists[pool]);
        poolExists[pool] = true;
        poolList.push(pool);
        poolListIndex[pool] = poolList.length - 1;
    }

    function removePool(address pool) public building admin {
        delete poolExists[pool];
        delete poolList[poolListIndex[pool]];
        delete poolListIndex[pool];
    }

    function addPoolGroup(address pool, string group) public building admin {
        require(poolExists[pool]);
        require(!poolGroups[pool].groupExists[group]);
        poolGroups[pool].groups.push(group);
        poolGroups[pool].groupExists[group] = true;
    }

    function castVote(address voter) public voting validPool {
        require(!voterVoted[voter]);
        voterVoted[voter] = true;
        poolVoters[msg.sender].push(voter);
    }
}

contract RegistrationPool is ElectionPhaseable {
    mapping (address => bool) ballotExists;
    address[] ballots;
    mapping (address => string) votes;
    mapping (address => bool) voterVoted;

    function addBallot(address bal) public building admin {
        require(!ballotExists[bal]);
        ballotExists[bal] = true;
        ballots.push(bal);
    }

    function getVote(address voter) public constant returns (string) {
        require(isClosed() || msg.sender == voter || ballotExists[msg.sender]);
        return votes[voter];
    }

    function clearBallots() public building admin {
        delete ballots;
    }

    function castVote(string vote) public voting {
        require(!voterVoted[msg.sender]);
        voterVoted[msg.sender] = true;
        votes[msg.sender] = vote;
        for(uint256 i = 0; i<ballots.length; i++) {
            Ballot(ballots[i]).castVote(msg.sender);
        }
    }
}