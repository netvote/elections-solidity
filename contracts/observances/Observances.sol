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

import "../state/Lockable.sol";


contract Observances is Lockable {

    mapping(bytes32 => ScopedEntries) observances;

    struct ScopedEntries {
        mapping(string => bool) referenceExists;
        ObservationEntry[] entries;
    }

    struct ObservationEntry {
        string reference;
        uint timestamp;
    }

    modifier noDuplicates(bytes32 scope, string reference) {
        require(!observances[scope].referenceExists[reference]);
        _;
    }

    function addEntry(bytes32 scope, string reference, uint timestamp) public admin noDuplicates(scope, reference) {
        observances[scope].entries.push(ObservationEntry({
            reference: reference,
            timestamp: timestamp
        }));
        observances[scope].referenceExists[reference] = true;
    }

    function getLength(bytes32 scope) public view returns (uint) {
        return observances[scope].entries.length;
    }

    function referenceAt(bytes32 scope, uint index) public view returns (string) {
        return observances[scope].entries[index].reference;
    }
    
    function timestampAt(bytes32 scope, uint index) public view returns (uint) {
        return observances[scope].entries[index].timestamp;
    }
}