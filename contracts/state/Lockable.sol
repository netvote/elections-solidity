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

import "../auth/Adminable.sol";


/**
 * @title Lockable
 * @dev This safety feature allows one to globally lock a contract to prevent abuse
 * This is used by state machines to confirm the current state.
 */
contract Lockable is Adminable {
    event Locked();
    event Unlocked();

    bool lockState = false;

    modifier locked() {
        require(lockState);
        _;
    }

    modifier unlocked() {
        require(!lockState);
        _;
    }

    function isLocked() public view returns (bool) {
        return lockState;
    }

    function lock() public admin unlocked {
        lockState = true;
        emit Locked();
    }

    function unlock() public admin locked {
        lockState = false;
        emit Unlocked();
    }
}