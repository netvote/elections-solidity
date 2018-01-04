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

import "./Lockable.sol";


/**
 * @title ElectionPhaseable
 * @dev State machine for election contracts.
 * Building = while building the election
 * Voting = votes are coming in (no changes allowed)
 * Closed = votes may no longer arrive
 * Aborted = admin determined there was a problem and all activities must stop
 */
contract ElectionPhaseable is Lockable {
    event Closed();
    event Activated();
    event Aborted();

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

    function isClosed() public constant returns (bool) {
        return electionPhase == ElectionPhase.Closed;
    }

    function checkConfig() public constant returns (bool) {
        //override in other contracts if there are verifications pre-activation
        return true;
    }

    function activate() public building admin {
        require(checkConfig());
        electionPhase = ElectionPhase.Voting;
        Activated();
    }

    function close() public voting admin {
        electionPhase = ElectionPhase.Closed;
        Closed();
    }

    function abort() public admin {
        electionPhase = ElectionPhase.Aborted;
        Aborted();
    }
}