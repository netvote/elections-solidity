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

import "../state/ElectionPhaseable.sol";


/**
 * @title KeyHolder
 * @dev allows storage of a public and private key for encryption/decryption.
 * If symmetric encryption is used, simply use the private key field upon reveal.
 * Only the revealer address may reveal a key.
 */
contract KeyHolder is ElectionPhaseable {

    event KeyReleased();

    address revealer;
    string public publicKey;
    string public privateKey;

    constructor (address revealerAddr) public {
        revealer = revealerAddr;
    }

    modifier onlyRevealer(){
        require(msg.sender == revealer);
        _;
    }

    //TODO: instead of from admin, this should be only key writer (specified address)
    function setPublicKey(string key) public onlyRevealer {
        publicKey = key;
    }

    //TODO: instead of from admin, this should be only key writer (specified address)
    function setPrivateKey(string key) public onlyRevealer {
        privateKey = key;
        emit KeyReleased();
    }
}