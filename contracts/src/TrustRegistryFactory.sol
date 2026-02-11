// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {TrustRegistry} from "./TrustRegistry.sol";

contract TrustRegistryFactory {
    address public immutable implementation;
    address[] public registries;

    event RegistryCreated(address indexed registry, string name, address indexed creator);

    constructor() {
        implementation = address(new TrustRegistry());
    }

    function createRegistry(
        string calldata _name,
        address[] calldata _initialValidators,
        uint256 _memberThreshold,
        uint256 _validatorThresholdPct,
        uint256 _proposalDuration,
        address _checker
    ) external returns (address) {
        address clone = Clones.clone(implementation);
        TrustRegistry(clone).initialize(
            _name,
            _initialValidators,
            _memberThreshold,
            _validatorThresholdPct,
            _proposalDuration,
            _checker
        );
        registries.push(clone);
        emit RegistryCreated(clone, _name, msg.sender);
        return clone;
    }

    function registryCount() external view returns (uint256) {
        return registries.length;
    }

    function getRegistries() external view returns (address[] memory) {
        return registries;
    }
}
