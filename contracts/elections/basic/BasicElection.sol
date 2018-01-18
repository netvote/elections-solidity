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

import "../BaseElection.sol";
import "../BaseBallot.sol";
import "../BasePool.sol";


/**
 * @title BasicElection
 * @dev Basic all-in-one election
 * Includes 1 pool, 1 ballot, 1 election, and no result groupings
 */
contract BasicElection is BasePool, BaseBallot, BaseElection {

    /**
      * @dev Constructor for creating a BasicElection
      * @param createdById string reference for external systems (not for contract code)
      * @param allowanceAddress The address of global allowance contract.
      * @param ownerOfAllowance The owner of the Vote Allowance to deduct from.
      * @param allowUpdates Whether to allow Voters to update their vote.
      * @param revealerAddress The address of the Key Revealer that will post the Key.
      * @param location The location reference for the ballot metadata (e.g., IPFS Reference)
      * @param gatewayAddress The address of the Vote Gateway that will submit votes.
      * @param autoActivate Automatically activate this election to allow votes
      */
    function BasicElection(
        string createdById,
        address allowanceAddress,
        address ownerOfAllowance,
        bool allowUpdates,
        address revealerAddress,
        string location,
        address gatewayAddress,
        bool autoActivate) BaseElection(allowanceAddress, ownerOfAllowance, allowUpdates, revealerAddress) BaseBallot(msg.sender, location) BasePool(createdById, this, gatewayAddress) public
    {
        electionType = "BASIC";
        //pool lists this so it will comply with tally api contract (like tiered election)
        addBallot(this);
        if (autoActivate) {
            activate();
        }
    }

}