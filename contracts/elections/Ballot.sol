pragma solidity ^0.4.17;

import '../ElectionPhaseable.sol';

contract Ballot is ElectionPhaseable {
    address public election;
    string public metadataLocation;
}