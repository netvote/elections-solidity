let Election = artifacts.require("./elections/Election.sol");

contract('Election Admin Actions', function(accounts) {
  let election;
  let admin = accounts[1];

  beforeEach(async () => {
    election = await Election.new({from: admin});
  });

  it("should assert true", function(done) {
    assert.isTrue(true);
    done();
  });
});
