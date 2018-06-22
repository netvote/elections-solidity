VERSION=18

clean:
	rm -rf ./build

build:
	truffle compile

migrate_ropsten:
	truffle migrate --network ropsten

migrate_netvote:
	truffle migrate --network netvote

migrate: migrate_ropsten migrate_netvote

upload:
	aws s3 sync ./build/contracts/ s3://netvote-election-contracts/$(VERSION)/ --acl public-read

publish: clean build migrate upload
