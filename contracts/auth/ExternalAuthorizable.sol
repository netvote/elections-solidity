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

import "./Adminable.sol";


/**
 * @title ExternalAuthorizable
 * @dev Allows an external system to ask whether an entry is authorized
 */
contract ExternalAuthorizable is Adminable {
    mapping (bytes32 => bool) authorized;

    function isAuthorized(bytes32 entry) public constant returns (bool) {
        return authorized[entry];
    }

    function addAuthorized(bytes32 entry) public admin {
        authorized[entry] = true;
    }

    function removeAuthorized(bytes32 entry) public admin {
        authorized[entry] = false;
    }
}