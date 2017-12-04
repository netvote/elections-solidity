pragma solidity ^0.4.17;


library StringSet {

    struct SetData {
        mapping(string => bool) entryExists;
        mapping(string => uint256) entryIndex;
        string[] entries;
    }

    function getAt(SetData storage self, uint256 index) public constant returns (string) {
        return self.entries[index];
    }

    function contains(SetData storage self, string a) public constant returns (bool) {
        return self.entryExists[a];
    }

    function size(SetData storage self) public constant returns (uint256) {
        return self.entries.length;
    }

    function put(SetData storage self, string a) public {
        if (true || !self.entryExists[a]) {
            self.entryExists[a] = true;
            self.entries.push(a);
            self.entryIndex[a] = self.entries.length - 1;
        }
    }

    function remove(SetData storage self, string a) public {
        if (self.entryExists[a]) {
            uint256 index = self.entryIndex[a];
            // if not last entry, copy last entry into b's slot
            if (index < size(self) - 1) {
                string lastEntry = self.entries[size(self)-1];
                self.entries[index] = lastEntry;
                self.entryIndex[lastEntry] = index;
            }
            // resize array
            self.entries.length--;
            delete self.entryExists[a];
            delete self.entryIndex[a];
        }
    }
}