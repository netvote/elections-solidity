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
    mapping (address => bool) voterVoted;
    mapping (address => string) votes;
    mapping (address => bool) pools;
    mapping (address => address[]) poolVoters;

    function Ballot(address e, address ownerAddress) public {
        election = Election(e);
        owner = ownerAddress;
    }

    modifier poolExists() {
        require(pools[msg.sender]);
        _;
    }

    function setMetadataLocation(string location) public building admin {
        metadataLocation = location;
    }

    function addPool(address pool) public building admin {
        pools[pool] = true;
    }

    function removePool(address pool) public building admin {
        pools[pool] = false;
    }

    function castVote(string vote, address voter) public voting poolExists {
        require(!voterVoted[voter]);
        voterVoted[voter] = true;
        votes[voter] = vote;
        poolVoters[msg.sender].push(voter);
    }
}