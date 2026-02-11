// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IOwnershipChecker} from "../TrustRegistry.sol";

interface ICryptoPunks {
    function punkIndexToAddress(uint256 punkIndex) external view returns (address);
}

contract PunksChecker is IOwnershipChecker {
    address public immutable punks;

    constructor(address _punks) {
        punks = _punks;
    }

    function isOwner(uint256 tokenId, address account) external view returns (bool) {
        return ICryptoPunks(punks).punkIndexToAddress(tokenId) == account;
    }
}
