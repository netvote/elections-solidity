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
import "./links/BallotRegistry.sol";
import "./links/PoolRegistry.sol";
import "../encryption/KeyHolder.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";


/**
 * @title BaseElection
 * @dev A base contract that transacts vote allowance and allows a key to be released
 */
contract BaseElection is KeyHolder, ReentrancyGuard {

    VoteAllowance allowance;
    address allowanceAccount;
    bool public allowVoteUpdates;
    string public electionType;
    string public createdBy;

    function BaseElection(
        string createdById,
        address allowanceAddress,
        address acct,
        bool allowUpdates,
        address revealer) KeyHolder(revealer) public
    {
        createdBy = createdById;
        allowance = VoteAllowance(allowanceAddress);
        allowanceAccount = acct;
        allowVoteUpdates = allowUpdates;
    }

    function deductVote() public voting nonReentrant {
        allowance.deduct(allowanceAccount);
    }
}