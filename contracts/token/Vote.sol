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

pragma solidity ^0.4.18;

import "../state/Lockable.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/token/BurnableToken.sol";
import "zeppelin-solidity/contracts/ReentrancyGuard.sol";


/**
 * @title Vote
 * @dev Token for voting
 */
contract Vote is Lockable, ReentrancyGuard, MintableToken, BurnableToken {
    string public name = "VOTE";
    string public symbol = "VOTE";
    uint8 public decimals = 18;
    event Vote(address election);

    function spendVote() public unlocked nonReentrant {
        require(balances[msg.sender] >= 1 ether);
        burn(1 ether);
        Vote(msg.sender);
    }

}