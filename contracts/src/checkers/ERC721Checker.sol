// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IOwnershipChecker} from "../TrustRegistry.sol";

interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract ERC721Checker is IOwnershipChecker {
    address public immutable token;

    constructor(address _token) {
        token = _token;
    }

    function isOwner(uint256 tokenId, address account) external view returns (bool) {
        return IERC721(token).ownerOf(tokenId) == account;
    }
}
