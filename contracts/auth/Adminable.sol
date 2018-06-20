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

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


//TODO: replace with openzepplin's whitelist contract
/**
 * @title Adminable
 * @dev Allows an owner to specify other admins to delegate actions
 */
contract Adminable is Ownable {
    mapping (address => bool) adminAddress;

    modifier admin() {
        require(isAdmin(msg.sender));
        _;
    }

    function isAdmin(address addr) public view returns (bool) {
        return addr != address(0) && (addr == owner || adminAddress[addr]);
    }

    function addAdmin(address addr) public onlyOwner {
        adminAddress[addr] = true;
    }

    function removeAdmin(address addr) public onlyOwner {
        adminAddress[addr] = false;
    }

    function removeSelf() public admin {
        adminAddress[msg.sender] = false;
    }
}