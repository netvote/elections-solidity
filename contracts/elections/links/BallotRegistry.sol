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

pragma solidity ^0.4.24;

import "../../state/ElectionPhaseable.sol";
import "../../lib/AddressSet.sol";


/**
 * @title BallotRegistry
 * @dev Hooks for iterating over a list of ballots.  This uses an AddressSet
 * which prevents duplicates and allows for removal.
 * Note: Order is not guaranteed.
 */
contract BallotRegistry is ElectionPhaseable {
    using AddressSet for AddressSet.SetData;

    AddressSet.SetData ballotSet;

    function getBallotIndex(address b) public view returns (uint256) {
        return ballotSet.indexOf(b);
    }

    function getBallot(uint256 index) public view returns(address) {
        return ballotSet.getAt(index);
    }

    function getBallotCount() public view returns (uint256) {
        return ballotSet.size();
    }

    function addBallot(address b) public building admin {
        ballotSet.put(b);
    }

    function removeBallot(address b) public building admin {
        ballotSet.remove(b);
    }

    function ballotExists(address b) public view returns (bool) {
        return ballotSet.contains(b);
    }
}