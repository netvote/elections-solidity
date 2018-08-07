const getBlockNumber = async () => {
    return new Promise((resolve, reject) => {
        web3.eth.getBlockNumber((err,blockNum)=>{resolve(blockNum)})
    })
}
const getBlock = async (i) => {
    return new Promise((resolve, reject) => {
        web3.eth.getBlock(i, true, (err,block)=>{ resolve(block)})
    })
}

const getTransactionsByAccount = async (myaccount, startBlockNumber, endBlockNumber) => {
    if (endBlockNumber == null) {
      endBlockNumber = await getBlockNumber();
    }
    if (startBlockNumber == null) {
      startBlockNumber = endBlockNumber - 1000;
    }
    console.log("Searching for transactions to/from account \"" + myaccount + "\" within blocks "  + startBlockNumber + " and " + endBlockNumber);
  
    for (var i = startBlockNumber; i <= endBlockNumber; i++) {
      var block = await getBlock(i);
      if (block != null && block.transactions != null) {
        block.transactions.forEach( function(e) {
          if (myaccount == "*" || myaccount == e.from || myaccount == e.to) {
            console.log("  tx hash          : " + e.hash + "\n"
              + "   nonce           : " + e.nonce + "\n"
              + "   blockHash       : " + e.blockHash + "\n"
              + "   blockNumber     : " + e.blockNumber + "\n"
              + "   transactionIndex: " + e.transactionIndex + "\n"
              + "   from            : " + e.from + "\n" 
              + "   to              : " + e.to + "\n"
              + "   value           : " + e.value + "\n"
              + "   time            : " + block.timestamp + " " + new Date(block.timestamp * 1000).toGMTString() + "\n"
              + "   gasPrice        : " + e.gasPrice + "\n"
              + "   gas             : " + e.gas + "\n"
              + "   input           : " + e.input);
          }
        })
      }
    }
  }

  module.exports = async function(callback) {
      let electionId = ""
      process.argv.forEach((item) => {
          if(item.startsWith('0x')){
              electionId = item;
          }
      })
      if(!electionId){
          callback(new Error("missing electionId (0xabc...) as parameter"))
          return;
      } 

      getTransactionsByAccount(electionId)

      callback()
      return;
  }