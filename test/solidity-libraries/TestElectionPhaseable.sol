pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../../contracts/state/ElectionPhaseable.sol";

// technique from http://truffleframework.com/tutorials/testing-for-throws-in-solidity-tests
contract ThrowProxy {
    address public target;
    bytes data;

    function ThrowProxy(address _target) public {
        target = _target;
    }

    //prime the data using the fallback function.
    function() public {
        data = msg.data;
    }

    function execute() public returns (bool) {
        return target.call(data);
    }
}

// this lets us test the modifier
contract PhaseableContract is ElectionPhaseable {

    function closedModifier() public closed {
        // does nothing
    }
}

contract TestElectionPhaseable {

    function testClosedThrowExceptionDueToState() public {
        PhaseableContract phaseable = new PhaseableContract();
        ThrowProxy throwProxy = new ThrowProxy(address(phaseable));
        PhaseableContract(address(throwProxy)).closedModifier();
        bool notThrown = throwProxy.execute.gas(200000)();
        Assert.isFalse(notThrown, "Expected false, because should throw exception");
    }

    function testClosedThrowExceptionDueToLock() public {
        PhaseableContract phaseable = new PhaseableContract();
        ThrowProxy throwProxy = new ThrowProxy(address(phaseable));

        phaseable.activate();
        phaseable.close();
        phaseable.lock();

        PhaseableContract(address(throwProxy)).closedModifier();
        bool notThrown = throwProxy.execute.gas(200000)();
        Assert.isFalse(notThrown, "Expected false, because should throw exception");
    }


    function testClosedNotThrowException() public {
        PhaseableContract phaseable = new PhaseableContract();
        ThrowProxy throwProxy = new ThrowProxy(address(phaseable));
        phaseable.activate();
        phaseable.close();
        PhaseableContract(address(throwProxy)).closedModifier();
        bool notThrown = throwProxy.execute.gas(200000)();
        Assert.isTrue(notThrown, "Expected true, because should not throw exception");
    }

}