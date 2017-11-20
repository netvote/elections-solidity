pragma solidity ^0.4.17;

import './Adminable.sol';


contract Lockable is Adminable {

    bool lockState = false;

    modifier locked() {
        require(lockState);
        _;
    }

    modifier unlocked() {
        require(!lockState);
        _;
    }

    function isLocked() constant returns (bool) {
        return lockState;
    }

    function lock() admin {
        lockState = true;
    }

    function unlock() admin {
        lockState = false;
    }
}