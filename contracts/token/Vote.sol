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
import "../stats/UtilizationTracker.sol";
import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/token/BurnableToken.sol";


/**
 * @title Vote
 * @dev Token for voting
 */
contract Vote is Lockable, MintableToken, BurnableToken, UtilizationTracker {
    string public name = "VOTE";
    string public symbol = "VOTE";
    uint8 public decimals = 18;

    mapping(address => bool) minters;

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner);
        _;
    }

    function addMinter(address m) admin {
        minters[m] = true;
    }

    function removeMinter(address m) admin {
        minters[m] = false;
    }

    function mint(address _to, uint256 _amount) onlyMinter canMint public returns (bool) {
        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        Mint(_to, _amount);
        Transfer(0x0, _to, _amount);
        return true;
    }

    function spendVote() public unlocked {
        require(balances[msg.sender] >= 1 ether);
        incrementUtilization();
        burn(1 ether);
    }
}