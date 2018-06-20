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
 * @title Bytes32Set
 * @dev iterable map of bytes32 for that modifies size upon removal
 * Note that the order changes upon removal.
 */
library Bytes32Set {

    struct SetData {
        mapping(bytes32 => bool) entryExists;
        mapping(bytes32 => uint256) entryIndex;
        bytes32[] entries;
    }

    function indexOf(SetData storage self, bytes32 b) public view returns (uint256) {
        return self.entryIndex[b];
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
            self.entryIndex[b] = self.entries.length - 1;
        }
    }

    function remove(SetData storage self, bytes32 b) public {
        if (self.entryExists[b]) {
            uint256 index = self.entryIndex[b];
            // if not last entry, copy last entry into b's slot
            if (index < size(self) - 1) {
                bytes32 lastEntry = self.entries[size(self)-1];
                self.entries[index] = lastEntry;
                self.entryIndex[lastEntry] = index;
            }
            // resize array
            self.entries.length--;
            delete self.entryExists[b];
            delete self.entryIndex[b];
        }
    }
}