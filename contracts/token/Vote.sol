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
contract Vote is Lockable, MintableToken, BurnableToken {
    string public name = "VOTE";
    string public symbol = "VOTE";
    uint8 public decimals = 18;
    uint256 public votesGeneratedPerVote = 0;
    address stakeAddress;
    uint256 amountGenerated;

    function Vote(address stakeContract, uint256 voteGenerationNum) public {
        require(stakeContract != address(0));
        stakeAddress = stakeContract;
        votesGeneratedPerVote = voteGenerationNum;
    }

    modifier onlyStakeContract() {
        require(msg.sender == stakeAddress);
        _;
    }

    function spendVote() public unlocked {
        require(balances[msg.sender] >= 1 ether);
        if (votesGeneratedPerVote > 0) {
            amountGenerated += votesGeneratedPerVote;
        }
        burn(1 ether);
    }

    function setStakeContract(address stakeContract) public unlocked admin {
        require(stakeContract != address(0));
        stakeAddress = stakeContract;
    }

    function setVotesGeneratedPerVote(uint256 voteGenerationNum) public unlocked admin {
        votesGeneratedPerVote = voteGenerationNum;
    }

    function mintGenerated() public onlyStakeContract unlocked nonReentrant {
        if (amountGenerated > 0) {
            uint256 amount = amountGenerated;
            amountGenerated = 0;
            totalSupply = totalSupply.add(amount);
            balances[stakeAddress] = balances[stakeAddress].add(amount);
            Mint(stakeAddress, amount);
            Transfer(0x0, stakeAddress, amount);
        }
    }
}