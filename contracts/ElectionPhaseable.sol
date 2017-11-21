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

    function isClosed() public constant returns (bool) {
        return electionPhase == ElectionPhase.Closed;
    }

    function activate() public building admin {
        electionPhase = ElectionPhase.Voting;
    }

    function close() public voting admin {
        electionPhase = ElectionPhase.Closed;
    }

    function abort() public admin {
        electionPhase = ElectionPhase.Aborted;
    }
}