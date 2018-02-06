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

import "../../state/ElectionPhaseable.sol";
import "../../lib/AddressSet.sol";


/**
 * @title PoolRegistry
 * @dev Hooks for iterating over a list of pools.  This uses an AddressSet
 * which prevents duplicates and allows for removal.
 * Note: Order is not guaranteed.
 */
contract PoolRegistry is ElectionPhaseable {
    using AddressSet for AddressSet.SetData;

    AddressSet.SetData poolSet;

    function getPoolIndex(address p) public constant returns (uint256) {
        return poolSet.indexOf(p);
    }

    function getPool(uint256 index) public constant returns(address) {
        return poolSet.getAt(index);
    }

    function getPoolCount() public constant returns (uint256) {
        return poolSet.size();
    }

    function addPool(address p) public building admin {
        poolSet.put(p);
    }

    function removePool(address p) public building admin {
        poolSet.remove(p);
    }

    function poolExists(address p) public constant returns (bool) {
        return poolSet.contains(p);
    }
}