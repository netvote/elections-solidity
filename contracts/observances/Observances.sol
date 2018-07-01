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

    event ObservanceAdded(
    string scopeId, 
    string submitId, 
    string ref, 
    address source
    );
    
    mapping(string => ScopedEntries) observances;
    
    // per election (or other group)
    struct ScopedEntries {
        mapping(string => bool) submitIdExists;
        mapping(string => SubmissionEntries) submissions;
        string[] submitIds;
    }

    // per submission
    struct SubmissionEntries {
        mapping(string => bool) referenceExists;
        ObservationEntry[] entries;
    }

    struct ObservationEntry {
        string reference;
        uint timestamp;
    }

    modifier noDuplicates(string scopeId, string submitId, string ref) {
        require(!observances[scopeId].submissions[submitId].referenceExists[ref]);
        _;
    }

    function addEntry(
        string scopeId, 
        string submitId, 
        string ref, 
        uint ts) public admin noDuplicates(scopeId, submitId, ref) 
        {
        observances[scopeId].submissions[submitId].entries.push(ObservationEntry({
            reference: ref,
            timestamp: ts
        }));
        observances[scopeId].submissions[submitId].referenceExists[ref] = true;
        if (!observances[scopeId].submitIdExists[submitId]) {
            observances[scopeId].submitIdExists[submitId] = true;
            observances[scopeId].submitIds.push(submitId);
        }
        emit ObservanceAdded(
            scopeId, 
            submitId, 
            ref, 
            msg.sender);
    }

    function submitIdLength(string scopeId) public view returns (uint) {
        return observances[scopeId].submitIds.length;
    }

    function submitIdAt(string scopeId, uint index) public view returns (string) {
        return observances[scopeId].submitIds[index];
    }

    function referenceLength(string scopeId, string submitId) public view returns (uint) {
        return observances[scopeId].submissions[submitId].entries.length;
    }

    function referenceAt(string scopeId, string submitId, uint index) public view returns (string) {
        return observances[scopeId].submissions[submitId].entries[index].reference;
    }
    
    function timestampAt(string scopeId, string submitId, uint index) public view returns (uint) {
        return observances[scopeId].submissions[submitId].entries[index].timestamp;
    }
}