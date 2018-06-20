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


/**
 * @title NoRemovalBytes32Set
 * @dev iterable map of bytes32 that has no way to remove (cheaper bookkeeping)
 */
library NoRemovalBytes32Set {

    struct SetData {
        mapping(bytes32 => bool) entryExists;
        bytes32[] entries;
    }

    function getAt(SetData storage self, uint256 index) public view returns (bytes32) {
        return self.entries[index];
    }

    function contains(SetData storage self, bytes32 b) public view returns (bool) {
        return self.entryExists[b];
    }

    function size(SetData storage self) public view returns (uint256) {
        return self.entries.length;
    }

    function put(SetData storage self, bytes32 b) public {
        if (!self.entryExists[b]) {
            self.entryExists[b] = true;
            self.entries.push(b);
        }
    }
}