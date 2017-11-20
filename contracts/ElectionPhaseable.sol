pragma solidity ^0.4.17;

import './Lockable.sol';


contract ElectionPhaseable is Lockable {

    ElectionPhase public electionPhase = ElectionPhase.Building;

    enum ElectionPhase {
        Building,
        Voting,
        Closed,
        Aborted
    }

    modifier building() {
        require(!isLocked() && electionPhase == ElectionPhase.Building);
        _;
    }

    modifier voting() {
        require(!isLocked() && electionPhase == ElectionPhase.Voting);
        _;
    }

    modifier closed() {
        require(!isLocked() && electionPhase == ElectionPhase.Closed);
        _;
    }

    modifier aborted() {
        require(electionPhase == ElectionPhase.Aborted);
        _;
    }

    function activate() building admin {
        electionPhase = ElectionPhase.Voting;
    }

    function close() voting admin {
        electionPhase = ElectionPhase.Closed;
    }

    function abort() admin {
        electionPhase = ElectionPhase.Aborted;
    }
}