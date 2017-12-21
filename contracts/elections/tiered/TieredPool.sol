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

import "../BasePool.sol";
import "./TieredBallot.sol";
import "./TieredElection.sol";


/**
 * @title TieredPool
 * @dev This allows a particular group over voters to collect votes for a set
 * of mapped ballots.
 */
contract TieredPool is BasePool {

    function TieredPool(address el, address gw) BasePool(el, gw) public {

    }

    // returns true if pool can vote on election
    function checkConfig() public constant returns (bool) {
        // election is valid addr
        if (election == address(0)) {
            return false;
        }
        // has ballots
        if ( ballotSet.size() == 0) {
            return false;
        }
        // election includes this pool
        if (!TieredElection(election).poolExists(this)) {
            return false;
        }
        //all ballots include pool, and election includes ballot
        for (uint256 i = 0; i<ballotSet.size(); i++) {
            if (!TieredBallot(ballotSet.getAt(i)).poolExists(this)) {
                return false;
            }
            if (!TieredElection(election).ballotExists(ballotSet.getAt(i))) {
                return false;
            }
        }
        return true;
    }

    // for each ballot, cast vote for sender, store vote to pool
    function castVote(bytes32 voteId, string vote) public voting notDuplicate(voteId) onlyGateway {
        for (uint256 i = 0; i<ballotSet.size(); i++) {
            TieredBallot(ballotSet.getAt(i)).castVote(voteId);
        }
        super.castVote(voteId, vote);
    }

}