// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../TrustRegistry.sol";

/// @notice Mock ownership checker for local development. Maps tokenId => owner.
contract MockChecker is IOwnershipChecker {
    mapping(uint256 => address) public owners;

    function setOwner(uint256 tokenId, address owner) external {
        owners[tokenId] = owner;
    }

    function isOwner(uint256 tokenId, address account) external view returns (bool) {
        return owners[tokenId] == account;
    }
}
