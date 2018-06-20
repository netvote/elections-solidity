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

import "../basic/BasicElection.sol";


/**
 * @title TokenElection
 * @dev Allows token holders to vote
 */
contract TokenElection is BasicElection {

    address public tokenAddress;
    uint public balanceTime;

    /**
      * @dev Constructor for creating a BasicElection
      * @param hashedUserId bytes32 sha3 hash of external userId
      * @param allowanceAddress The address of global allowance contract.
      * @param ownerOfAllowance The owner of the Vote Allowance to deduct from.
      * @param allowUpdates Whether to allow Voters to update their vote.
      * @param revealerAddress The address of the Key Revealer that will post the Key.
      * @param location The location reference for the ballot metadata (e.g., IPFS Reference)
      * @param gatewayAddress The address of the Vote Gateway that will submit votes.
      * @param autoActivate Automatically activate this election to allow votes
      * @param erc20Token Address of token whose holders are voting
      * @param balanceTimestamp Timestamp for balance evaluation for weighted voting
      */
    constructor (
        bytes32 hashedUserId,
        address allowanceAddress,
        address ownerOfAllowance,
        bool allowUpdates,
        address revealerAddress,
        string location,
        address gatewayAddress,
        bool autoActivate,
        address erc20Token,
        uint balanceTimestamp) BasicElection(hashedUserId, allowanceAddress, ownerOfAllowance, allowUpdates, revealerAddress, location, gatewayAddress, false) public
    {
        require(erc20Token != address(0));
        require(isContract(erc20Token));
        electionType = "TOKEN";
        tokenAddress = erc20Token;

        //balance must be in past for gateway-confirmed token elections
        require(balanceTimestamp < now);
        balanceTime = balanceTimestamp;

        if (autoActivate) {
            activate();
        }
    }

    function isContract(address addr) internal view returns (bool) {
        uint size;
        assembly { size := extcodesize(addr) }
        return size > 0;
    }

}