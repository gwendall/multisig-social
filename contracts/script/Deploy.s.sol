// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TrustRegistryFactory.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        TrustRegistryFactory factory = new TrustRegistryFactory();
        console.log("Factory deployed at:", address(factory));
        vm.stopBroadcast();
    }
}
