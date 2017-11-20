let Election = artifacts.require("./elections/Election.sol");

contract('Election Admin Actions', function(accounts) {
  let election;
  let admin = accounts[1];

  beforeEach(() => {
    return Election.new({from: admin}).then((e) => {
        election = e;
    }).then((e) => {

    });
  });

  it("should assert true", function(done) {
    let e = Election.deployed();
    assert.isTrue(true);
    done();
  });
});
