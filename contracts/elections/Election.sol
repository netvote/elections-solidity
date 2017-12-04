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

import "./VoteAllowance.sol";
import "../base/BallotRegistry.sol";
import "../base/PoolRegistry.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";

// Election
// top-level structure for election
contract Election is BallotRegistry, PoolRegistry, ReentrancyGuard {

    event KeyReleased();

    VoteAllowance allowance;
    address allowanceAccount;

    string public publicKey;
    string public privateKey;
    bool public allowVoteUpdates;

    /**
     * @dev Create an election
     * @param allowanceAddress address of Netvote VoteAllowance contract
     * @param acct address of account from whom to deduct votes from
     * @param allowUpdates allow voters to update votes after voting
     */
    function Election(address allowanceAddress, address acct, bool allowUpdates) public {
        allowance = VoteAllowance(allowanceAddress);
        allowanceAccount = acct;
        allowVoteUpdates = allowUpdates;
    }

    function checkConfig() public constant returns (bool) {
        //TODO: implement
        return true;
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

    modifier poolIsAllowed() {
        require(poolSet.contains(msg.sender));
        _;
    }

    function castVote() public voting nonReentrant poolIsAllowed {
        allowance.deduct(allowanceAccount);
    }
}