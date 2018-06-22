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

import "../state/Lockable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";


/**
 * @title VoteAllowance
 * @dev Token for voting
 */
contract VoteAllowance is Lockable, MintableToken, BurnableToken {
    event CloseElection(address e);

    string public name = "VOTE";
    string public symbol = "VOTE";
    uint8 public decimals = 18;

    mapping(address => bool) minters;
    mapping(address => bool) elections;

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner);
        _;
    }

    modifier onlyElection() {
        require(elections[msg.sender]);
        _;
    }

    function addElection(address e) public admin {
        elections[e] = true;
    }

    function removeElection(address e) public admin {
        elections[e] = false;
    }

    function addMinter(address m) public admin {
        minters[m] = true;
    }

    function removeMinter(address m) public admin {
        minters[m] = false;
    }

    function mint(address _to, uint256 _amount) onlyMinter canMint public returns (bool) {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    function closeElection() public onlyElection {
        emit CloseElection(msg.sender);
    }

    function spendVote() public unlocked {
        require(balances[msg.sender] >= 1 ether);
        burn(1 ether);
    }
}