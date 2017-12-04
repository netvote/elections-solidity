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
    event Vote(address voter);
    event UpdateVote(address voter);
    event RegisterVoter(address voter);
    event UnregisterVoter(address voter);

    // vote for each voter
    mapping (address => string) votes;

    // map to prevent duplicate votes
    mapping (address => bool) voterVoted;

    // map to record whether voter is registered
    mapping (address => bool) registeredVoters;

    address[] ballots;

    address registrar;

    function RegistrationPool(address el, address reg) public {
        election = Election(el);
        registrar = reg;
    }

    modifier onlyRegistrar() {
        require(msg.sender == registrar);
        _;
    }

    modifier registeredVoter() {
        require(registeredVoters[msg.sender]);
        _;
    }

    // register a voter
    function register(address v) public onlyRegistrar {
        require(!registeredVoters[v]);
        registeredVoters[v] = true;
        RegisterVoter(v);
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

    function activate() public building admin {
        for (uint256 i = 0; i<ballotSet.size(); i++) {
            ballots.push(ballotSet.getAt(i));
        }
        super.activate();
    }

    // only can be unregistered if not already voted
    function unregister(address v) public admin {
        require(registeredVoters[v] && !voterVoted[v]);
        delete registeredVoters[v];
        UnregisterVoter(v);
    }

    // get a particular voter's vote (only voter can read unless closed)
    function getVote(address voter) public constant returns (string) {
        require(isClosed() || msg.sender == voter);
        return votes[voter];
    }

    // avoids allowing a duplicate vote
    modifier notDuplicate() {
        require(!voterVoted[msg.sender]);
        voterVoted[msg.sender] = true;
        _;
    }

    // checks election to see if updates to votes are allowed
    modifier updatesAllowed() {
        require(election.allowVoteUpdates());
        _;
    }

    // for each ballot, cast vote for sender, store vote to pool
    function castVote(string vote) public voting notDuplicate registeredVoter {
        votes[msg.sender] = vote;
        for (uint256 i = 0; i<ballots.length; i++) {
            Ballot(ballots[i]).castVote(msg.sender);
        }
        election.castVote();
        Vote(msg.sender);
    }

    // voter can update their vote if election allows it
    function updateVote(string vote) public voting updatesAllowed {
        require(voterVoted[msg.sender]);
        votes[msg.sender] = vote;
        UpdateVote(msg.sender);
    }
}