pragma solidity ^0.4.17;

import '../ElectionPhaseable.sol';
import './Election.sol';
import './Ballot.sol';

contract RegistrationPool is ElectionPhaseable {
    Election election;
    event Vote(address voter);

    mapping (address => bool) ballotExists;
    address[] ballots;
    mapping (address => string) votes;
    mapping (address => bool) voterVoted;

    function RegistrationPool(address e) public {
        election = Election(e);
    }

    function addBallot(address bal) public building admin {
        require(!ballotExists[bal]);
        ballotExists[bal] = true;
        ballots.push(bal);
    }

    function getVote(address voter) public constant returns (string) {
        require(isClosed() || msg.sender == voter);
        return votes[voter];
    }

    function clearBallots() public building admin {
        delete ballots;
    }

    modifier notDuplicate() {
        require(!voterVoted[msg.sender]);
        voterVoted[msg.sender] = true;
        _;
    }

    function castVote(string vote) public voting notDuplicate {
        votes[msg.sender] = vote;
        for(uint256 i = 0; i<ballots.length; i++) {
            Ballot(ballots[i]).castVote(msg.sender);
        }
        election.castVote();
        Vote(msg.sender);
    }
}