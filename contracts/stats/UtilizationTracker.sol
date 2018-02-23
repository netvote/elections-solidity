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

import "../auth/Adminable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract UtilizationTracker is Adminable {
    using SafeMath for uint256;

    UsageWindow[] public windows;
    uint granularity = 1 hours;

    struct UsageWindow {
        uint windowStart;
        uint256 utilization;
    }

    function UtilizationTracker() public {
        windows.push(UsageWindow({windowStart: block.timestamp, utilization: 0 }));
    }

    function setGranularity(uint gran) public admin {
        granularity = gran;
    }

    function getWindowCountSince(uint256 horizon) public constant returns (uint256) {
        uint256 count = 0;
        for (uint i = windows.length; i > 0; i--) {
            uint idx = i-1;
            if (windows[idx].windowStart < horizon) {
                break;
            }
            count = count.add(1);
        }
        return count;
    }

    function getUtilizationSince(uint256 horizon) public constant returns (uint256) {
        uint256 util = 0;
        for (uint i = windows.length; i > 0; i--) {
            uint idx = i-1;
            if (windows[idx].windowStart < horizon) {
                break;
            }
            util = util.add(windows[idx].utilization);
        }
        return util;
    }

    function incrementUtilization() internal {
        uint idx = windows.length-1;
        if (windows[idx].windowStart < (block.timestamp - (granularity))) {
            windows.push(UsageWindow({windowStart: block.timestamp, utilization: 1}));
        } else {
            windows[idx].utilization = windows[idx].utilization.add(1);
        }
    }
}
