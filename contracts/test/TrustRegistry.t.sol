// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TrustRegistry.sol";
import "../src/TrustRegistryFactory.sol";

// Mock ownership checker for testing
contract MockChecker is IOwnershipChecker {
    mapping(uint256 => address) public owners;

    function setOwner(uint256 tokenId, address owner) external {
        owners[tokenId] = owner;
    }

    function isOwner(uint256 tokenId, address account) external view returns (bool) {
        return owners[tokenId] == account;
    }
}

contract TrustRegistryTest is Test {
    TrustRegistryFactory factory;
    TrustRegistry registry;
    MockChecker checker;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");
    address dave = makeAddr("dave");
    address eve = makeAddr("eve");
    address outsider = makeAddr("outsider");
    address coldWallet = makeAddr("coldWallet");

    function setUp() public {
        factory = new TrustRegistryFactory();
        checker = new MockChecker();

        address[] memory validators = new address[](3);
        validators[0] = alice;
        validators[1] = bob;
        validators[2] = charlie;

        address registryAddr = factory.createRegistry(
            "Test Community",
            validators,
            2,
            67,
            7 days,
            address(checker)
        );

        registry = TrustRegistry(registryAddr);
    }

    // ──────────────────── Initialization ────────────────────

    function test_initialization() public view {
        assertEq(registry.name(), "Test Community");
        assertEq(registry.memberThreshold(), 2);
        assertEq(registry.validatorThresholdPct(), 67);
        assertEq(registry.proposalDuration(), 7 days);
        assertEq(registry.validatorCount(), 3);
        assertEq(registry.memberCount(), 3);

        assertTrue(registry.isValidator(alice));
        assertTrue(registry.isValidator(bob));
        assertTrue(registry.isValidator(charlie));

        assertTrue(registry.isMember(alice));
        assertTrue(registry.isMember(bob));
        assertTrue(registry.isMember(charlie));
    }

    function test_cannotReinitialize() public {
        address[] memory validators = new address[](1);
        validators[0] = alice;

        vm.expectRevert(TrustRegistry.AlreadyInitialized.selector);
        registry.initialize("Hack", validators, 1, 50, 1 days, address(0));
    }

    // ──────────────────── Applications ────────────────────

    function test_apply() public {
        vm.prank(dave);
        registry.applyToJoin();

        assertTrue(registry.hasApplied(dave));
        assertEq(registry.applicantCount(), 1);

        address[] memory apps = registry.getApplicants();
        assertEq(apps[0], dave);
    }

    function test_cannotApplyIfAlreadyMember() public {
        vm.prank(alice);
        vm.expectRevert(TrustRegistry.AlreadyMember.selector);
        registry.applyToJoin();
    }

    function test_cannotApplyTwice() public {
        vm.prank(dave);
        registry.applyToJoin();

        vm.prank(dave);
        vm.expectRevert(TrustRegistry.AlreadyApplied.selector);
        registry.applyToJoin();
    }

    function test_cancelApplication() public {
        vm.prank(dave);
        registry.applyToJoin();

        vm.prank(dave);
        registry.cancelApplication();

        assertFalse(registry.hasApplied(dave));
        assertEq(registry.applicantCount(), 0);
    }

    function test_applicationCleanedOnAccept() public {
        vm.prank(dave);
        registry.applyToJoin();
        assertTrue(registry.hasApplied(dave));

        _addMember(dave);

        assertFalse(registry.hasApplied(dave));
        assertEq(registry.applicantCount(), 0);
        assertTrue(registry.isMember(dave));
    }

    // ──────────────────── Add Member ────────────────────

    function test_addMember() public {
        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);
        assertEq(proposalId, 1);
        assertEq(registry.vouchCount(proposalId), 1);
        assertFalse(registry.isMember(dave));

        vm.prank(bob);
        registry.vouch(proposalId);

        assertTrue(registry.isMember(dave));
        assertEq(registry.memberCount(), 4);
    }

    function test_cannotAddExistingMember() public {
        vm.prank(alice);
        vm.expectRevert(TrustRegistry.AlreadyMember.selector);
        registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, bob);
    }

    function test_nonValidatorCannotPropose() public {
        vm.prank(outsider);
        vm.expectRevert(TrustRegistry.NotValidator.selector);
        registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);
    }

    // ──────────────────── Remove Member ────────────────────

    function test_removeMember() public {
        _addMember(dave);
        assertTrue(registry.isMember(dave));

        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.REMOVE_MEMBER, dave);

        vm.prank(bob);
        registry.vouch(proposalId);

        assertFalse(registry.isMember(dave));
        assertEq(registry.memberCount(), 3);
    }

    function test_removeMemberCleansAssetLink() public {
        _addMember(dave);

        // Link an asset
        checker.setOwner(1234, coldWallet);
        vm.prank(coldWallet);
        registry.linkAsset(1234, dave);
        assertTrue(registry.isVerifiedOwner(dave));

        // Remove dave
        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.REMOVE_MEMBER, dave);
        vm.prank(bob);
        registry.vouch(proposalId);

        // Asset link should be cleaned up
        TrustRegistry.AssetLink memory link = registry.getAssetLink(dave);
        assertFalse(link.linked);
    }

    function test_cannotRemoveNonMember() public {
        vm.prank(alice);
        vm.expectRevert(TrustRegistry.NotMember.selector);
        registry.propose(TrustRegistry.ProposalType.REMOVE_MEMBER, dave);
    }

    function test_cannotRemoveValidatorAsMember() public {
        vm.prank(alice);
        vm.expectRevert(TrustRegistry.AlreadyValidator.selector);
        registry.propose(TrustRegistry.ProposalType.REMOVE_MEMBER, bob);
    }

    // ──────────────────── Add Validator ────────────────────

    function test_addValidator() public {
        _addMember(dave);

        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, dave);
        assertEq(registry.vouchCount(proposalId), 1);
        assertFalse(registry.isValidator(dave));

        vm.prank(bob);
        registry.vouch(proposalId);
        assertFalse(registry.isValidator(dave));

        vm.prank(charlie);
        registry.vouch(proposalId);
        assertTrue(registry.isValidator(dave));
        assertEq(registry.validatorCount(), 4);
    }

    function test_cannotAddNonMemberAsValidator() public {
        vm.prank(alice);
        vm.expectRevert(TrustRegistry.NotMember.selector);
        registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, dave);
    }

    function test_cannotAddExistingValidator() public {
        vm.prank(alice);
        vm.expectRevert(TrustRegistry.AlreadyValidator.selector);
        registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, bob);
    }

    // ──────────────────── Remove Validator ────────────────────

    function test_removeValidator() public {
        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.REMOVE_VALIDATOR, charlie);

        vm.prank(bob);
        registry.vouch(proposalId);
        assertTrue(registry.isValidator(charlie));

        vm.prank(charlie);
        registry.vouch(proposalId);
        assertFalse(registry.isValidator(charlie));
        assertEq(registry.validatorCount(), 2);

        assertTrue(registry.isMember(charlie));
    }

    function test_cannotRemoveLastValidator() public {
        address[] memory validators = new address[](1);
        validators[0] = alice;
        address soloRegistry = factory.createRegistry("Solo", validators, 1, 100, 7 days, address(0));
        TrustRegistry solo = TrustRegistry(soloRegistry);

        vm.prank(alice);
        vm.expectRevert(TrustRegistry.LastValidator.selector);
        solo.propose(TrustRegistry.ProposalType.REMOVE_VALIDATOR, alice);
    }

    // ──────────────────── Vouch Guards ────────────────────

    function test_cannotDoubleVouch() public {
        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);

        vm.prank(alice);
        vm.expectRevert(TrustRegistry.AlreadyVouched.selector);
        registry.vouch(proposalId);
    }

    function test_cannotVouchExpiredProposal() public {
        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);

        vm.warp(block.timestamp + 8 days);

        vm.prank(bob);
        vm.expectRevert(TrustRegistry.ProposalExpired.selector);
        registry.vouch(proposalId);
    }

    function test_cannotVouchExecutedProposal() public {
        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);

        vm.prank(bob);
        registry.vouch(proposalId);

        vm.prank(charlie);
        vm.expectRevert(TrustRegistry.ProposalAlreadyExecuted.selector);
        registry.vouch(proposalId);
    }

    function test_cannotVouchInvalidProposal() public {
        vm.prank(alice);
        vm.expectRevert(TrustRegistry.ProposalNotFound.selector);
        registry.vouch(999);
    }

    // ──────────────────── Duplicate Proposals ────────────────────

    function test_cannotDuplicateActiveProposal() public {
        vm.prank(alice);
        registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);

        vm.prank(bob);
        vm.expectRevert(TrustRegistry.DuplicateActiveProposal.selector);
        registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);
    }

    function test_canReproposeAfterExpiry() public {
        vm.prank(alice);
        registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);

        vm.warp(block.timestamp + 8 days);

        vm.prank(bob);
        uint256 newId = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);
        assertEq(newId, 2);
    }

    function test_canReproposeAfterExecution() public {
        _addMember(dave);

        vm.prank(alice);
        uint256 proposalId = registry.propose(TrustRegistry.ProposalType.REMOVE_MEMBER, dave);
        vm.prank(bob);
        registry.vouch(proposalId);
        assertFalse(registry.isMember(dave));

        vm.prank(alice);
        uint256 newId = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);
        assertTrue(newId > proposalId);
    }

    // ──────────────────── Asset Linking ────────────────────

    function test_linkAsset() public {
        _addMember(dave);

        checker.setOwner(1234, coldWallet);

        vm.prank(coldWallet);
        registry.linkAsset(1234, dave);

        TrustRegistry.AssetLink memory link = registry.getAssetLink(dave);
        assertTrue(link.linked);
        assertEq(link.tokenId, 1234);
        assertEq(link.ownerWallet, coldWallet);
        assertTrue(registry.isVerifiedOwner(dave));
    }

    function test_cannotLinkIfNotOwner() public {
        _addMember(dave);

        checker.setOwner(1234, coldWallet);

        vm.prank(outsider);
        vm.expectRevert(TrustRegistry.NotAssetOwner.selector);
        registry.linkAsset(1234, dave);
    }

    function test_cannotLinkIfNotMember() public {
        checker.setOwner(1234, coldWallet);

        vm.prank(coldWallet);
        vm.expectRevert(TrustRegistry.NotMember.selector);
        registry.linkAsset(1234, dave);
    }

    function test_cannotLinkAlreadyLinkedAsset() public {
        _addMember(dave);
        _addMember(eve);

        checker.setOwner(1234, coldWallet);

        vm.prank(coldWallet);
        registry.linkAsset(1234, dave);

        vm.prank(coldWallet);
        vm.expectRevert(TrustRegistry.AssetAlreadyLinked.selector);
        registry.linkAsset(1234, eve);
    }

    function test_unlinkAssetByMember() public {
        _addMember(dave);
        checker.setOwner(1234, coldWallet);
        vm.prank(coldWallet);
        registry.linkAsset(1234, dave);

        vm.prank(dave);
        registry.unlinkAsset(dave);

        TrustRegistry.AssetLink memory link = registry.getAssetLink(dave);
        assertFalse(link.linked);
        assertFalse(registry.isVerifiedOwner(dave));
    }

    function test_unlinkAssetByValidator() public {
        _addMember(dave);
        checker.setOwner(1234, coldWallet);
        vm.prank(coldWallet);
        registry.linkAsset(1234, dave);

        vm.prank(alice); // alice is a validator
        registry.unlinkAsset(dave);

        assertFalse(registry.isVerifiedOwner(dave));
    }

    function test_isVerifiedOwnerFalseAfterTransfer() public {
        _addMember(dave);
        checker.setOwner(1234, coldWallet);
        vm.prank(coldWallet);
        registry.linkAsset(1234, dave);

        assertTrue(registry.isVerifiedOwner(dave));

        // Simulate asset transfer - cold wallet no longer owns it
        checker.setOwner(1234, outsider);

        assertFalse(registry.isVerifiedOwner(dave));
    }

    // ──────────────────── Registry without checker ────────────────────

    function test_registryWithoutChecker() public {
        address[] memory validators = new address[](1);
        validators[0] = alice;
        address noCheckerAddr = factory.createRegistry("No Checker", validators, 1, 100, 7 days, address(0));
        TrustRegistry noChecker = TrustRegistry(noCheckerAddr);

        assertFalse(noChecker.isVerifiedOwner(alice));

        vm.prank(alice);
        vm.expectRevert(TrustRegistry.NoChecker.selector);
        noChecker.linkAsset(1234, alice);
    }

    // ──────────────────── Views ────────────────────

    function test_getValidators() public view {
        address[] memory v = registry.getValidators();
        assertEq(v.length, 3);
    }

    function test_getMembers() public view {
        address[] memory m = registry.getMembers();
        assertEq(m.length, 3);
    }

    function test_getProposal() public {
        vm.prank(alice);
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);

        TrustRegistry.Proposal memory p = registry.getProposal(id);
        assertEq(uint8(p.proposalType), uint8(TrustRegistry.ProposalType.ADD_MEMBER));
        assertEq(p.target, dave);
        assertEq(p.proposer, alice);
        assertFalse(p.executed);
    }

    function test_getRequiredVouches() public view {
        assertEq(registry.getRequiredVouches(TrustRegistry.ProposalType.ADD_MEMBER), 2);
        assertEq(registry.getRequiredVouches(TrustRegistry.ProposalType.REMOVE_MEMBER), 2);
        assertEq(registry.getRequiredVouches(TrustRegistry.ProposalType.ADD_VALIDATOR), 3);
        assertEq(registry.getRequiredVouches(TrustRegistry.ProposalType.REMOVE_VALIDATOR), 3);
    }

    // ──────────────────── Factory ────────────────────

    function test_factoryTracksRegistries() public view {
        assertEq(factory.registryCount(), 1);
        address[] memory regs = factory.getRegistries();
        assertEq(regs.length, 1);
        assertEq(regs[0], address(registry));
    }

    function test_factoryCreatesMultiple() public {
        address[] memory validators = new address[](1);
        validators[0] = alice;

        factory.createRegistry("Second", validators, 1, 100, 1 days, address(0));
        factory.createRegistry("Third", validators, 1, 100, 1 days, address(0));

        assertEq(factory.registryCount(), 3);
    }

    // ──────────────────── Member Governance ────────────────────
    // Members elect and kick validators. Validators manage members.

    function test_memberCanProposeAddValidator() public {
        _addMember(dave); // dave is member, not validator

        vm.prank(dave);
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, dave);
        assertEq(registry.vouchCount(id), 1); // auto-vouch
        assertFalse(registry.isValidator(dave));
    }

    function test_memberCanProposeRemoveValidator() public {
        _addMember(dave);

        vm.prank(dave);
        uint256 id = registry.propose(TrustRegistry.ProposalType.REMOVE_VALIDATOR, charlie);
        assertEq(registry.vouchCount(id), 1);
        assertTrue(registry.isValidator(charlie)); // not yet removed
    }

    function test_memberCanVouchOnValidatorProposal() public {
        _addMember(dave);

        vm.prank(alice); // alice is both member + validator
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, dave);

        vm.prank(dave); // member, not validator
        registry.vouch(id);
        assertEq(registry.vouchCount(id), 2);
    }

    function test_nonMemberCannotProposeValidator() public {
        _addMember(dave);

        vm.prank(outsider);
        vm.expectRevert(TrustRegistry.NotMember.selector);
        registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, dave);
    }

    function test_nonMemberCannotVouchOnValidatorProposal() public {
        _addMember(dave);

        vm.prank(alice);
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, dave);

        vm.prank(outsider);
        vm.expectRevert(TrustRegistry.NotMember.selector);
        registry.vouch(id);
    }

    function test_validatorProposalNeverExpires() public {
        _addMember(dave);

        vm.prank(alice);
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, dave);

        // Warp a year into the future — way past proposalDuration
        vm.warp(block.timestamp + 365 days);

        vm.prank(bob);
        registry.vouch(id); // should NOT revert
        assertEq(registry.vouchCount(id), 2);
    }

    function test_memberProposalStillExpires() public {
        vm.prank(alice);
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, dave);

        vm.warp(block.timestamp + 8 days);

        vm.prank(bob);
        vm.expectRevert(TrustRegistry.ProposalExpired.selector);
        registry.vouch(id);
    }

    function test_validatorThresholdBasedOnMemberCount() public {
        _addMember(dave);
        _addMember(eve);
        // 5 members, 3 validators, 67% threshold
        // Required: ceil(5 * 67 / 100) = ceil(3.35) = (5*67+99)/100 = 434/100 = 4
        assertEq(registry.getRequiredVouches(TrustRegistry.ProposalType.ADD_VALIDATOR), 4);
        assertEq(registry.getRequiredVouches(TrustRegistry.ProposalType.REMOVE_VALIDATOR), 4);
        // Member proposals still use memberThreshold = 2
        assertEq(registry.getRequiredVouches(TrustRegistry.ProposalType.ADD_MEMBER), 2);
    }

    function test_memberCannotProposeMemberChange() public {
        _addMember(dave);

        vm.prank(dave); // member, not validator
        vm.expectRevert(TrustRegistry.NotValidator.selector);
        registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, eve);
    }

    function test_memberCannotVouchOnMemberProposal() public {
        _addMember(dave);

        vm.prank(alice); // validator
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, eve);

        vm.prank(dave); // member, not validator
        vm.expectRevert(TrustRegistry.NotValidator.selector);
        registry.vouch(id);
    }

    function test_fullValidatorElection() public {
        _addMember(dave);
        _addMember(eve);
        // 5 members, 67% → need 4 vouches

        vm.prank(alice);
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_VALIDATOR, dave);
        // auto-vouch: 1

        vm.prank(bob);
        registry.vouch(id); // 2

        vm.prank(charlie);
        registry.vouch(id); // 3
        assertFalse(registry.isValidator(dave)); // not yet — need 4

        vm.prank(eve);
        registry.vouch(id); // 4 — threshold met
        assertTrue(registry.isValidator(dave));
        assertEq(registry.validatorCount(), 4);
    }

    function test_fullValidatorRemoval() public {
        // 3 members = 3 validators, 67% → ceil(3*67/100) = 3 vouches
        vm.prank(alice);
        uint256 id = registry.propose(TrustRegistry.ProposalType.REMOVE_VALIDATOR, charlie);
        // auto-vouch: 1

        vm.prank(bob);
        registry.vouch(id); // 2
        assertTrue(registry.isValidator(charlie)); // not yet

        vm.prank(charlie); // charlie can vote to remove himself (he's a member)
        registry.vouch(id); // 3 — threshold met
        assertFalse(registry.isValidator(charlie));
        assertTrue(registry.isMember(charlie)); // still a member
        assertEq(registry.validatorCount(), 2);
    }

    // ──────────────────── Helpers ────────────────────

    function _addMember(address who) internal {
        vm.prank(alice);
        uint256 id = registry.propose(TrustRegistry.ProposalType.ADD_MEMBER, who);
        vm.prank(bob);
        registry.vouch(id);
    }
}
