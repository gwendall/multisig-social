// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TrustRegistryFactory.sol";
import "../src/TrustRegistry.sol";
import "../src/checkers/MockChecker.sol";

contract SeedScript is Script {
    // Anvil default private keys
    uint256 constant KEY0 = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant KEY1 = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 constant KEY2 = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
    uint256 constant KEY3 = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6;
    uint256 constant KEY4 = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a;
    uint256 constant KEY5 = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba;

    // Anvil default addresses
    address constant ACC0 = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    address constant ACC1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant ACC2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address constant ACC3 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    address constant ACC4 = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;

    function run() external {
        vm.startBroadcast(KEY0);

        // Deploy factory + mock checker
        TrustRegistryFactory factory = new TrustRegistryFactory();
        MockChecker checker = new MockChecker();

        // Assign punk ownership (Gwendall, Sean Bonner, Sergito, Arkaydeus, Tschuuuly)
        checker.setOwner(2113, ACC0);
        checker.setOwner(4736, ACC1);
        checker.setOwner(6507, ACC2);
        checker.setOwner(6843, ACC3);
        checker.setOwner(1477, ACC4);

        // Create registry with checker
        address[] memory validators = new address[](3);
        validators[0] = ACC0;
        validators[1] = ACC1;
        validators[2] = ACC2;

        address registryAddr = factory.createRegistry(
            "CryptoPunks Trust", validators, 2, 67, 7 days, address(checker)
        );

        TrustRegistry registry = TrustRegistry(registryAddr);

        // Propose acc3 as member
        uint256 id1 = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, ACC3);
        vm.stopBroadcast();

        // Acc1 vouches → auto-executes (threshold = 2)
        vm.startBroadcast(KEY1);
        registry.vouch(id1);
        vm.stopBroadcast();

        // Propose acc4 as member
        vm.startBroadcast(KEY0);
        uint256 id2 = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, ACC4);
        vm.stopBroadcast();

        vm.startBroadcast(KEY1);
        registry.vouch(id2);
        vm.stopBroadcast();

        // Link punks to members
        vm.startBroadcast(KEY0);
        registry.linkAsset(2113, ACC0);
        vm.stopBroadcast();

        vm.startBroadcast(KEY1);
        registry.linkAsset(4736, ACC1);
        vm.stopBroadcast();

        vm.startBroadcast(KEY2);
        registry.linkAsset(6507, ACC2);
        vm.stopBroadcast();

        vm.startBroadcast(KEY3);
        registry.linkAsset(6843, ACC3);
        vm.stopBroadcast();

        vm.startBroadcast(KEY4);
        registry.linkAsset(1477, ACC4);
        vm.stopBroadcast();

        // Account 5 applies
        vm.startBroadcast(KEY5);
        registry.applyToJoin();
        vm.stopBroadcast();

        console.log("Factory:", address(factory));
        console.log("MockChecker:", address(checker));
        console.log("Registry:", registryAddr);
        console.log("Seed complete! 5 members, 5 linked punks, 1 applicant");
    }
}
