pragma solidity ^0.4.17;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';


contract Adminable is Ownable {
    mapping (address => bool) adminAddress;

    modifier admin() {
        require(msg.sender == owner || adminAddress[msg.sender]);
        _;
    }

    function addAdmin(address addr) admin {
        adminAddress[addr] = true;
    }

    function removeAdmin(address addr) admin {
        adminAddress[addr] = false;
    }
}