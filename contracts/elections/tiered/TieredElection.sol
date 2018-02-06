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

import "../links/BallotRegistry.sol";
import "../links/PoolRegistry.sol";
import "../BaseElection.sol";


/**
 * @title TieredElection
 * @dev This allows one to map many ballots and pools into a single election.
 * Only registered pools are allowed to transact vote allowance.
 */
contract TieredElection is BaseElection, BallotRegistry, PoolRegistry {

    /**
     * @dev Create an election
     * @param allowanceAddress address of Netvote VoteAllowance contract
     * @param acct address of account from whom to deduct votes from
     * @param allowUpdates allow voters to update votes after voting
     */
    function TieredElection(
        bytes32 hashedUserId,
        address allowanceAddress,
        address acct,
        bool allowUpdates,
        address revealer) BaseElection(hashedUserId, allowanceAddress, acct, allowUpdates, revealer) public
    {
        electionType = "TIERED";
    }

    function checkConfig() public constant returns (bool) {
        //TODO: implement confirmation that election is configured
        return true;
    }

    //only allow pools that are listed explicitly
    modifier poolIsAllowed() {
        require(poolSet.contains(msg.sender));
        _;
    }

    function deductVote() public poolIsAllowed {
        super.deductVote();
    }
}