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


let ExternalAuthorizable = artifacts.require("ExternalAuthorizable");

let assertIsAuthorized = async (authorizable, uid, expectation) => {
    let result = await authorizable.isAuthorized(web3.sha3(uid));
    assert.equal(result, expectation, "expected "+uid+" to have isAuthorized="+expectation);
};

contract('ExternalAuthorizable', function (accounts) {
    let owner;
    let authorizable;
    const goodUid = "good";
    const badUid = "bad";

    beforeEach(async () => {
        owner = accounts[0];
        authorizable = await ExternalAuthorizable.new({from: owner});
    });

    it("should start with no one as authorized", async function () {
        await assertIsAuthorized(authorizable, goodUid, false);
        await assertIsAuthorized(authorizable, badUid, false);
    });

    it("should add authorized", async function () {
        await authorizable.addAuthorized(web3.sha3(goodUid));
        await assertIsAuthorized(authorizable, goodUid, true);
        await assertIsAuthorized(authorizable, badUid, false);
    });

    it("should remove authorized", async function () {
        await authorizable.addAuthorized(web3.sha3(goodUid));
        await authorizable.removeAuthorized(web3.sha3(goodUid));
        await assertIsAuthorized(authorizable, goodUid, false);
        await assertIsAuthorized(authorizable, badUid, false);
    });

});