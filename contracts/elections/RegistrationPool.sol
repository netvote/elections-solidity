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

import "./Election.sol";
import "./Ballot.sol";
import "../links/BallotRegistry.sol";


contract RegistrationPool is BallotRegistry {
    Election public election;

    // events
    event Vote(bytes32 voteId);
    event UpdateVote(bytes32 voteId);

    // voteId to vote map
    mapping (bytes32 => string) public votes;

    // map to prevent duplicate votes
    mapping (bytes32 => bool) voteIdVoted;

    address[] ballots;

    address public gateway;

    function RegistrationPool(address el, address gw) public {
        election = Election(el);
        gateway = gw;
    }

    modifier onlyGateway() {
        require(msg.sender == gateway);
        _;
    }

    // returns true if pool can vote on all configured ballots
    function checkBallots() public constant returns (bool) {
        // ballots are configured
        if ( ballotSet.size() == 0) {
            return false;
        }
        // all ballots have this pool
        for (uint256 i = 0; i<ballotSet.size(); i++) {
            Ballot ballot = Ballot(ballotSet.getAt(i));
            if (!ballot.poolExists(this)) {
                return false;
            }
        }
        return true;
    }

    // returns true if pool can vote on election
    function checkElection() public constant returns (bool) {
        if (election == address(0)) {
            return false;
        }
        if (!election.poolExists(this)) {
            return false;
        }
        for (uint256 i = 0; i<ballotSet.size(); i++) {
            if (!Ballot(ballotSet.getAt(i)).poolExists(this)) {
                return false;
            }
            if (!election.ballotExists(ballotSet.getAt(i))) {
                return false;
            }
        }
        return true;
    }

    // returns true if pool can vote on election
    function checkConfig() public constant returns (bool) {
        return checkElection() && checkBallots();
    }

    // activates pool
    function activate() public building admin {
        for (uint256 i = 0; i<ballotSet.size(); i++) {
            ballots.push(ballotSet.getAt(i));
        }
        super.activate();
    }

    // avoids allowing a duplicate vote
    modifier notDuplicate(bytes32 voteId) {
        require(!voteIdVoted[voteId]);
        voteIdVoted[voteId] = true;
        _;
    }

    // checks election to see if updates to votes are allowed
    modifier updatesAllowed() {
        require(election.allowVoteUpdates());
        _;
    }

    // for each ballot, cast vote for sender, store vote to pool
    function castVote(bytes32 voteId, string vote) public voting notDuplicate(voteId) onlyGateway {
        votes[voteId] = vote;
        for (uint256 i = 0; i<ballots.length; i++) {
            Ballot(ballots[i]).castVote(voteId);
        }
        election.castVote();
        Vote(voteId);
    }

    // voter can update their vote if election allows it
    function updateVote(bytes32 voteId, string vote) public voting updatesAllowed onlyGateway {
        require(voteIdVoted[voteId]);
        votes[voteId] = vote;
        UpdateVote(voteId);
    }
}