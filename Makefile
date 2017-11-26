.PHONY: clean test

clean:
	rm -rf build

lint:
	solium -d contracts/

compile:
	truffle compile

test:
	truffle test

build: clean lint test compile