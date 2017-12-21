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


// KeyRevealable
// allows one to reveal a key
contract KeyHolder is ElectionPhaseable {

    event KeyReleased();

    address revealer;
    string public publicKey;
    string public privateKey;

    function KeyHolder(address revealerAddr) public {
        revealer = revealerAddr;
    }

    modifier onlyRevealer(){
        require(msg.sender == revealer);
        _;
    }

    //TODO: instead of from admin, this should be only key writer (specified address)
    function setPublicKey(string key) public building onlyRevealer {
        publicKey = key;
    }

    //TODO: instead of from admin, this should be only key writer (specified address)
    function setPrivateKey(string key) public closed onlyRevealer {
        privateKey = key;
        KeyReleased();
    }
}