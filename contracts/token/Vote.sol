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

/**
 * @title Vote
 * @dev Token for voting
 */
contract Vote is Lockable, MintableToken {
    string public name = "VOTE";
    string public symbol = "VOTE";
    uint8 public decimals = 0;
    uint256 public votesGeneratedPerVote = 0;
    address stakeAddress;

    function Vote(address stakeContract, uint256 voteGenerationNum){
        require(stakeContract != address(0));
        stakeAddress = stakeContract;
        votesGeneratedPerVote = voteGenerationNum;
    }

    function setStakeContract(address stakeContract) public unlocked admin {
        require(stakeContract != address(0));
        stakeAddress = stakeContract;
    }

    function setVotesGeneratedPerVote(uint256 voteGenerationNum) public unlocked admin {
        votesGeneratedPerVote = voteGenerationNum;
    }

    function mintAndDeliverVote() internal {
        if(votesGeneratedPerVote > 0){
            totalSupply = totalSupply.add(votesGeneratedPerVote);
            balances[stakeAddress] = balances[stakeAddress].add(votesGeneratedPerVote);
            Mint(stakeAddress, votesGeneratedPerVote);
            Transfer(0x0, stakeAddress, votesGeneratedPerVote);
        }
    }

    function spendVote() public unlocked {
        require(balances[msg.sender] >= 1);
        mintAndDeliverVote();
        transfer(stakeAddress, 1);
    }
}