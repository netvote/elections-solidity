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

import "../state/ElectionPhaseable.sol";
import "../lib/AddressSet.sol";


contract BallotRegistry is Adminable, ElectionPhaseable {
    using AddressSet for AddressSet.SetData;

    AddressSet.SetData ballotSet;

    function getBallot(uint256 index) public constant returns(address) {
        return ballotSet.getAt(index);
    }

    function getBallotCount() public constant returns (uint256) {
        return ballotSet.size();
    }

    function addBallot(address b) public building admin {
        ballotSet.put(b);
    }

    function removeBallot(address b) public building admin {
        ballotSet.remove(b);
    }

    function ballotExists(address b) public constant returns (bool) {
        return ballotSet.contains(b);
    }
}