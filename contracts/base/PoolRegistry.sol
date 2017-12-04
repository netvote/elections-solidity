pragma solidity ^0.4.17;

import "../ElectionPhaseable.sol";
import "../lib/AddressSet.sol";


contract PoolRegistry is Adminable, ElectionPhaseable {
    using AddressSet for AddressSet.SetData;

    AddressSet.SetData poolSet;

    function getPool(uint256 index) public constant returns(address) {
        return poolSet.getAt(index);
    }

    function getPoolCount() public constant returns (uint256) {
        return poolSet.size();
    }

    function addPool(address p) public building admin {
        poolSet.put(p);
    }

    function removePool(address p) public building admin {
        poolSet.remove(p);
    }

    function poolExists(address p) public constant returns (bool) {
        return poolSet.contains(p);
    }
}