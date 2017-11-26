pragma solidity ^0.4.17;

import '../ElectionPhaseable.sol';
import './Election.sol';
import './Ballot.sol';

contract RegistrationPool is ElectionPhaseable {
    Election election;
    event Vote(address voter);
    event UpdateVote(address voter);

    // map that lets us avoid adding duplicate ballots to ballot list
    mapping (address => bool) ballotExists;

    // list of ballots where votes will be distributed
    // note: ballot must also allow this pool
    address[] ballots;

    // vote for each voter
    mapping (address => string) votes;

    // map to prevent duplicate votes
    mapping (address => bool) voterVoted;

    function RegistrationPool(address e) public {
        election = Election(e);
    }

    // add a ballot to this pool
    // note: ballot must also allow this pool
    function addBallot(address bal) public building admin {
        require(!ballotExists[bal]);
        ballotExists[bal] = true;
        ballots.push(bal);
    }

    // get a particular voter's vote (only voter can read unless closed)
    function getVote(address voter) public constant returns (string) {
        require(isClosed() || msg.sender == voter);
        return votes[voter];
    }

    // reset the ballot list
    function clearBallots() public building admin {
        for(uint256 i = 0; i<ballots.length; i++) {
            delete ballotExists[ballots[i]];
        }
        delete ballots;
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
    function castVote(string vote) public voting notDuplicate {
        votes[msg.sender] = vote;
        for(uint256 i = 0; i<ballots.length; i++) {
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