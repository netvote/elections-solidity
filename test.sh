#!/bin/bash

set -e

if [ $1 = "lint" ]; then
    npm run lint
elif [ $1 = "coverage" ]; then
    npm install -g codecov
    npm run coverage
    codecov
elif [ $1 = "gas" ]; then
    ganache-cli --gasLimit 200000000 2> /dev/null 1> /dev/null &
    sleep 5
    npm run test-gas
    killall ganache-cli || true
fi
