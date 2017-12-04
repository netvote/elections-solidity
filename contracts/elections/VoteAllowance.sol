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

import "../state/Lockable.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";


contract VoteAllowance is Lockable, ReentrancyGuard {
    event Vote(address election);
    event ElectionRegistered(address acct, address election);
    event ElectionUnregistered(address acct, address election);

    // how many votes a votecoin buys for this address
    mapping(address => uint256) votesPerCoin;

    // number of votes left on an account
    mapping(address => uint256) allowance;

    // elections allowed to transact for account
    mapping(address => mapping(address => bool)) accountToElections;

    // if new contract is purchased, this is rate
    uint256 currentVotesPerCoin;

    //TODO: right now only NETVOTE (owner of this contract) can add votes
    function addVotes(address account, uint256 votes) public unlocked admin nonReentrant {
        //TODO: transact votecoin
        allowance[account] = allowance[account] + votes;
    }

    // election must be allowed to transact on account
    modifier senderAllowed(address account){
        require(accountToElections[account][msg.sender]);
        _;
    }

    // allow an address (election) to transact on sender's behalf
    function addElection(address election) public unlocked {
        require(!accountToElections[msg.sender][election]);
        accountToElections[msg.sender][election] = true;
        ElectionRegistered(msg.sender, election);
    }

    // disallow an address (election) to transact on sender's behalf
    function removeElection(address election) public unlocked {
        require(accountToElections[msg.sender][election]);
        accountToElections[msg.sender][election] = false;
        ElectionUnregistered(msg.sender, election);
    }

    // subtract 1 vote from account
    function deduct(address account) public unlocked senderAllowed(account) nonReentrant {
        require(allowance[account] > 0);
        allowance[account] = allowance[account] - 1;
        Vote(msg.sender);
    }
}