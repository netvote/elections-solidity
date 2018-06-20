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

pragma solidity ^0.4.24;

import "../token/VoteAllowance.sol";
import "../auth/ExternalAuthorizable.sol";
import "./links/BallotRegistry.sol";
import "./links/PoolRegistry.sol";
import "../encryption/KeyHolder.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";


/**
 * @title BaseElection
 * @dev A base contract that transacts vote allowance and allows a key to be released
 */
contract BaseElection is ExternalAuthorizable, KeyHolder, ReentrancyGuard {

    VoteAllowance public voteToken;
    address voteOwner;
    bool public allowVoteUpdates;
    string public electionType;
    uint public startTime;
    uint public endTime;

    constructor (
        bytes32 hashedUserId,
        address tokenContractAddress,
        address acct,
        bool allowUpdates,
        address revealer) KeyHolder(revealer) public
    {
        addAuthorized(hashedUserId);
        voteToken = VoteAllowance(tokenContractAddress);
        voteOwner = acct;
        allowVoteUpdates = allowUpdates;
    }

    modifier validTime(){
        require(now > (startTime - 3 hours));
        require(endTime == 0 || now < (endTime + 3 hours));
        _;
    }

    function activate() public building admin {
        if (startTime == 0) {
            startTime = now;
        }
        super.activate();
    }

    function setTimes(uint electionStartTime, uint electionEndTime) public building admin {
        require(electionEndTime > electionStartTime);
        startTime = electionStartTime;
        endTime = electionEndTime;
    }

    function setVoteOwner(address acct) public admin {
        voteOwner = acct;
    }

    function withdrawAllVotes() public {
        require(msg.sender == voteOwner);
        voteToken.transfer(voteOwner, voteToken.balanceOf(this));
    }

    function withdrawVotes(uint256 value) public {
        require(msg.sender == voteOwner);
        voteToken.transfer(voteOwner, value);
    }

    function deductVote() public voting validTime nonReentrant {
        voteToken.spendVote();
    }
}