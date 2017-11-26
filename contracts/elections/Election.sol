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

import '../ElectionPhaseable.sol';
import './VoteAllowance.sol';
import 'zeppelin-solidity/contracts/ReentrancyGuard.sol';

// Election
// top-level structure for election
contract Election is ElectionPhaseable, ReentrancyGuard {
    event KeyReleased();

    VoteAllowance allowance;
    address allowanceAccount;

    string public publicKey;
    string public privateKey;

    mapping(address => bool) allowedPools;

    function Election(address allow, address acct) public {
        allowance = VoteAllowance(allow);
        allowanceAccount = acct;
    }

    //TODO: instead of from admin, this should be only key writer (specified address)
    function setPublicKey(string key) public building admin {
        publicKey = key;
    }

    //TODO: instead of from admin, this should be only key writer (specified address)
    function setPrivateKey(string key) public closed admin {
        privateKey = key;
        KeyReleased();
    }

    function addPool(address p) public building admin {
        allowedPools[p] = true;
    }

    function removePool(address p) public building admin {
        delete allowedPools[p];
    }

    modifier poolIsAllowed() {
        require(allowedPools[msg.sender]);
        _;
    }

    function castVote() public voting nonReentrant poolIsAllowed {
        allowance.deduct(allowanceAccount);
    }
}