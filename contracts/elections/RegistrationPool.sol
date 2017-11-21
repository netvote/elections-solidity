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

import './Election.sol';

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