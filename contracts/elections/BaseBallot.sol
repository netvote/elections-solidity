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
//-------------------------------------------------------------------------------

pragma solidity ^0.4.24;

import "../state/ElectionPhaseable.sol";


/**
 * @title BaseBallot
 * @dev A base ballot contract that knows how to store a metadataLocation
 */
contract BaseBallot is ElectionPhaseable {

    string public metadataLocation;

    constructor (address ownerAddress, string location) public {
        //owner = ownerAddress;
        adminAddress[ownerAddress] = true;
        metadataLocation = location;
    }

}