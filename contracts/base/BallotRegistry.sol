pragma solidity ^0.4.17;

import "../ElectionPhaseable.sol";
import "../lib/AddressSet.sol";


contract BallotRegistry is Adminable, ElectionPhaseable {
    using AddressSet for AddressSet.SetData;

    AddressSet.SetData ballotSet;

    function getBallot(uint256 index) public constant returns(address) {
        return ballotSet.getAt(index);
    }

    function getBallotCount() public constant returns (uint256) {
        return ballotSet.size();
    }

    function addBallot(address b) public building admin {
        ballotSet.put(b);
    }

    function removeBallot(address b) public building admin {
        ballotSet.remove(b);
    }

    function ballotExists(address b) public constant returns (bool) {
        return ballotSet.contains(b);
    }
}