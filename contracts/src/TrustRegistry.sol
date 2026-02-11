// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOwnershipChecker {
    function isOwner(uint256 tokenId, address account) external view returns (bool);
}

contract TrustRegistry {
    // ──────────────────── Types ────────────────────

    enum ProposalType {
        ADD_MEMBER,
        REMOVE_MEMBER,
        ADD_VALIDATOR,
        REMOVE_VALIDATOR
    }

    struct Proposal {
        ProposalType proposalType;
        address target;
        address proposer;
        uint40 createdAt;
        uint40 expiresAt;
        bool executed;
    }

    struct AssetLink {
        uint256 tokenId;
        address ownerWallet;
        bool linked;
    }

    // ──────────────────── State ────────────────────

    string public name;

    mapping(address => bool) public isValidator;
    mapping(address => bool) public isMember;
    address[] public validators;
    address[] public members;

    uint256 public memberThreshold;
    uint256 public validatorThresholdPct;
    uint256 public proposalDuration;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVouched;
    mapping(uint256 => uint256) public vouchCount;
    mapping(bytes32 => uint256) public activeProposal;

    // Asset linking
    IOwnershipChecker public checker;
    mapping(address => AssetLink) public assetLinks;
    mapping(uint256 => address) public assetToMember;

    // Applications
    address[] public applicants;
    mapping(address => bool) public hasApplied;

    bool private initialized;

    // ──────────────────── Events ────────────────────

    event Initialized(string name, address[] validators, uint256 memberThreshold, uint256 validatorThresholdPct);
    event ProposalCreated(uint256 indexed proposalId, ProposalType proposalType, address indexed target, address indexed proposer);
    event Vouched(uint256 indexed proposalId, address indexed validator, uint256 newVouchCount);
    event ProposalExecuted(uint256 indexed proposalId, ProposalType proposalType, address indexed target);
    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event Applied(address indexed applicant);
    event ApplicationCancelled(address indexed applicant);
    event AssetLinked(address indexed member, uint256 tokenId, address indexed ownerWallet);
    event AssetUnlinked(address indexed member, uint256 tokenId);

    // ──────────────────── Errors ────────────────────

    error AlreadyInitialized();
    error NotValidator();
    error AlreadyMember();
    error NotMember();
    error AlreadyValidator();
    error NotValidatorTarget();
    error LastValidator();
    error AlreadyVouched();
    error ProposalExpired();
    error ProposalAlreadyExecuted();
    error ProposalNotFound();
    error DuplicateActiveProposal();
    error InvalidThreshold();
    error NoValidators();
    error AlreadyApplied();
    error NotApplied();
    error NoChecker();
    error NotAssetOwner();
    error AssetAlreadyLinked();
    error NoAssetLinked();

    // ──────────────────── Modifiers ────────────────────

    modifier onlyValidator() {
        if (!isValidator[msg.sender]) revert NotValidator();
        _;
    }

    // ──────────────────── Initialization ────────────────────

    function initialize(
        string calldata _name,
        address[] calldata _initialValidators,
        uint256 _memberThreshold,
        uint256 _validatorThresholdPct,
        uint256 _proposalDuration,
        address _checker
    ) external {
        if (initialized) revert AlreadyInitialized();
        if (_initialValidators.length == 0) revert NoValidators();
        if (_memberThreshold == 0 || _memberThreshold > _initialValidators.length) revert InvalidThreshold();
        if (_validatorThresholdPct == 0 || _validatorThresholdPct > 100) revert InvalidThreshold();

        initialized = true;
        name = _name;
        memberThreshold = _memberThreshold;
        validatorThresholdPct = _validatorThresholdPct;
        proposalDuration = _proposalDuration;

        if (_checker != address(0)) {
            checker = IOwnershipChecker(_checker);
        }

        for (uint256 i = 0; i < _initialValidators.length; i++) {
            address v = _initialValidators[i];
            isValidator[v] = true;
            isMember[v] = true;
            validators.push(v);
            members.push(v);
        }

        emit Initialized(_name, _initialValidators, _memberThreshold, _validatorThresholdPct);
    }

    // ──────────────────── Applications ────────────────────

    function applyToJoin() external {
        if (isMember[msg.sender]) revert AlreadyMember();
        if (hasApplied[msg.sender]) revert AlreadyApplied();

        hasApplied[msg.sender] = true;
        applicants.push(msg.sender);
        emit Applied(msg.sender);
    }

    function cancelApplication() external {
        if (!hasApplied[msg.sender]) revert NotApplied();

        hasApplied[msg.sender] = false;
        _removeFromArray(applicants, msg.sender);
        emit ApplicationCancelled(msg.sender);
    }

    // ──────────────────── Proposals ────────────────────

    function propose(ProposalType _type, address _target) external onlyValidator returns (uint256) {
        // Guards
        if (_type == ProposalType.ADD_MEMBER) {
            if (isMember[_target]) revert AlreadyMember();
        } else if (_type == ProposalType.REMOVE_MEMBER) {
            if (!isMember[_target]) revert NotMember();
            if (isValidator[_target]) revert AlreadyValidator();
        } else if (_type == ProposalType.ADD_VALIDATOR) {
            if (!isMember[_target]) revert NotMember();
            if (isValidator[_target]) revert AlreadyValidator();
        } else if (_type == ProposalType.REMOVE_VALIDATOR) {
            if (!isValidator[_target]) revert NotValidatorTarget();
            if (validators.length <= 1) revert LastValidator();
        }

        // Prevent duplicate active proposals
        bytes32 key = keccak256(abi.encodePacked(_type, _target));
        uint256 existingId = activeProposal[key];
        if (existingId != 0) {
            Proposal storage existing = proposals[existingId];
            if (!existing.executed && block.timestamp <= existing.expiresAt) {
                revert DuplicateActiveProposal();
            }
        }

        // Create proposal
        proposalCount++;
        uint256 proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            proposalType: _type,
            target: _target,
            proposer: msg.sender,
            createdAt: uint40(block.timestamp),
            expiresAt: uint40(block.timestamp + proposalDuration),
            executed: false
        });

        activeProposal[key] = proposalId;

        emit ProposalCreated(proposalId, _type, _target, msg.sender);

        // Auto-vouch from proposer
        hasVouched[proposalId][msg.sender] = true;
        vouchCount[proposalId] = 1;
        emit Vouched(proposalId, msg.sender, 1);

        // Check if threshold met (e.g. memberThreshold == 1)
        _tryExecute(proposalId);

        return proposalId;
    }

    function vouch(uint256 _proposalId) external onlyValidator {
        if (_proposalId == 0 || _proposalId > proposalCount) revert ProposalNotFound();

        Proposal storage p = proposals[_proposalId];
        if (p.executed) revert ProposalAlreadyExecuted();
        if (block.timestamp > p.expiresAt) revert ProposalExpired();
        if (hasVouched[_proposalId][msg.sender]) revert AlreadyVouched();

        hasVouched[_proposalId][msg.sender] = true;
        vouchCount[_proposalId]++;

        emit Vouched(_proposalId, msg.sender, vouchCount[_proposalId]);

        _tryExecute(_proposalId);
    }

    // ──────────────────── Asset Linking ────────────────────

    function linkAsset(uint256 _tokenId, address _member) external {
        if (address(checker) == address(0)) revert NoChecker();
        if (!isMember[_member]) revert NotMember();
        if (!checker.isOwner(_tokenId, msg.sender)) revert NotAssetOwner();
        if (assetToMember[_tokenId] != address(0)) revert AssetAlreadyLinked();

        assetLinks[_member] = AssetLink({
            tokenId: _tokenId,
            ownerWallet: msg.sender,
            linked: true
        });
        assetToMember[_tokenId] = _member;

        emit AssetLinked(_member, _tokenId, msg.sender);
    }

    function unlinkAsset(address _member) external {
        AssetLink storage link = assetLinks[_member];
        if (!link.linked) revert NoAssetLinked();
        // Only the member themselves, the owner wallet, or a validator can unlink
        if (msg.sender != _member && msg.sender != link.ownerWallet && !isValidator[msg.sender]) {
            revert NotValidator();
        }

        uint256 tokenId = link.tokenId;
        delete assetToMember[tokenId];
        delete assetLinks[_member];

        emit AssetUnlinked(_member, tokenId);
    }

    // ──────────────────── Internal ────────────────────

    function _tryExecute(uint256 _proposalId) internal {
        Proposal storage p = proposals[_proposalId];
        if (p.executed) return;

        uint256 required;
        if (p.proposalType == ProposalType.ADD_MEMBER || p.proposalType == ProposalType.REMOVE_MEMBER) {
            required = memberThreshold;
        } else {
            required = (validators.length * validatorThresholdPct + 99) / 100;
        }

        if (vouchCount[_proposalId] >= required) {
            _execute(_proposalId);
        }
    }

    function _execute(uint256 _proposalId) internal {
        Proposal storage p = proposals[_proposalId];
        p.executed = true;

        bytes32 key = keccak256(abi.encodePacked(p.proposalType, p.target));
        delete activeProposal[key];

        if (p.proposalType == ProposalType.ADD_MEMBER) {
            isMember[p.target] = true;
            members.push(p.target);
            // Clean up application if they applied
            if (hasApplied[p.target]) {
                hasApplied[p.target] = false;
                _removeFromArray(applicants, p.target);
            }
            emit MemberAdded(p.target);
        } else if (p.proposalType == ProposalType.REMOVE_MEMBER) {
            isMember[p.target] = false;
            _removeFromArray(members, p.target);
            // Clean up asset link if exists
            if (assetLinks[p.target].linked) {
                delete assetToMember[assetLinks[p.target].tokenId];
                delete assetLinks[p.target];
            }
            emit MemberRemoved(p.target);
        } else if (p.proposalType == ProposalType.ADD_VALIDATOR) {
            isValidator[p.target] = true;
            validators.push(p.target);
            emit ValidatorAdded(p.target);
        } else if (p.proposalType == ProposalType.REMOVE_VALIDATOR) {
            isValidator[p.target] = false;
            _removeFromArray(validators, p.target);
            assert(validators.length > 0);
            emit ValidatorRemoved(p.target);
        }

        emit ProposalExecuted(_proposalId, p.proposalType, p.target);
    }

    function _removeFromArray(address[] storage arr, address target) internal {
        uint256 len = arr.length;
        for (uint256 i = 0; i < len; i++) {
            if (arr[i] == target) {
                arr[i] = arr[len - 1];
                arr.pop();
                return;
            }
        }
    }

    // ──────────────────── Views ────────────────────

    function getValidators() external view returns (address[] memory) {
        return validators;
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function getApplicants() external view returns (address[] memory) {
        return applicants;
    }

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        return proposals[_proposalId];
    }

    function getVouchCount(uint256 _proposalId) external view returns (uint256) {
        return vouchCount[_proposalId];
    }

    function validatorCount() external view returns (uint256) {
        return validators.length;
    }

    function memberCount() external view returns (uint256) {
        return members.length;
    }

    function applicantCount() external view returns (uint256) {
        return applicants.length;
    }

    function getRequiredVouches(ProposalType _type) external view returns (uint256) {
        if (_type == ProposalType.ADD_MEMBER || _type == ProposalType.REMOVE_MEMBER) {
            return memberThreshold;
        }
        return (validators.length * validatorThresholdPct + 99) / 100;
    }

    function getAssetLink(address _member) external view returns (AssetLink memory) {
        return assetLinks[_member];
    }

    function isVerifiedOwner(address _member) external view returns (bool) {
        AssetLink memory link = assetLinks[_member];
        if (!link.linked) return false;
        if (address(checker) == address(0)) return false;
        return checker.isOwner(link.tokenId, link.ownerWallet);
    }
}
