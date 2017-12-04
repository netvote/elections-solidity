.PHONY: clean test

clean:
	rm -rf build

lint:
	solium -d contracts/

compile:
	truffle compile

migrate:
	truffle migrate --reset

test:
	truffle test

build: clean lint compile migrate test