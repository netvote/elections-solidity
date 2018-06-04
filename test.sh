#!/bin/bash

set -e

ganache-cli --gasLimit 200000000 2> /dev/null 1> /dev/null &
sleep 5 # to make sure ganache-cli is up and running before compiling
echo "PORT 8545 PID: $(lsof -t -i:8545)"
rm -rf build
echo "compiling..."
truffle compile
echo "migrating..."
truffle migrate --reset --network development
echo "testing..."
truffle test --network development
kill -9 $(lsof -t -i:8545)