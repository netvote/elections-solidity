pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../../contracts/lib/NoRemovalBytes32Set.sol";

// this avoids a warning error for an uninitialized Set
contract SetWrapper {
    using NoRemovalBytes32Set for NoRemovalBytes32Set.SetData;
    NoRemovalBytes32Set.SetData set;

    function getAt(uint256 index) public constant returns (bytes32) {
        return set.getAt(index);
    }

    function contains(bytes32 a) public constant returns (bool) {
        return set.contains(a);
    }

    function size() public constant returns (uint256) {
        return set.size();
    }

    function put(bytes32 a) public {
        return set.put(a);
    }
}

contract TestNoRemovalBytes32Set {
    using NoRemovalBytes32Set for NoRemovalBytes32Set.SetData;

    function testTwoItems() public {
        SetWrapper set = new SetWrapper();

        bytes32 testData1 = keccak256("test1");
        bytes32 testData2 = keccak256("test2");
        bytes32 notIncluded = keccak256("test3");

        Assert.equal(set.size(), 0, "expected size of 0 before adding");
        set.put(testData1);
        Assert.equal(set.size(), 1, "expected size of 1 before adding");
        set.put(testData2);
        Assert.equal(set.size(), 2, "expected size of 2");

        // duplicate insert
        set.put(testData2);
        Assert.equal(set.size(), 2, "expected size of 2");

        //getAt
        Assert.equal(set.getAt(0), testData1, "expected testData1");
        Assert.equal(set.getAt(1), testData2, "expected testData2");

        //contains
        Assert.isTrue(set.contains(testData1), "expected contains testData1");
        Assert.isTrue(set.contains(testData2), "expected contains testData2");
        Assert.isFalse(set.contains(notIncluded), "expected contains testData2");

    }
}