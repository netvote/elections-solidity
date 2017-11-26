clean:
	rm -rf build

lint:
	solium -d contracts/

build: clean
	truffle compile

test:
	truffle test