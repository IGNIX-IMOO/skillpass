// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TrustRegistry {
    enum PassportStatus {
        DRAFT,
        PUBLISHED,
        PAUSED,
        RETIRED
    }

    enum LicenseStatus {
        ACTIVE,
        REVOKED,
        EXPIRED
    }

    enum ReceiptStatus {
        REJECTED,
        DELIVERED
    }

    struct Passport {
        bytes32 namespaceHash;
        bytes32 skillKeyHash;
        bytes32 currentVersionHash;
        bytes32 creatorProof;
        address owner;
        bytes32 serviceId;
        uint256 capabilityCircuitId;
        PassportStatus status;
        uint64 updatedAt;
    }

    struct License {
        bytes32 passportId;
        bytes32 licenseeAgentId;
        uint8 mode;
        uint16 quotaRemaining;
        uint8 royaltyBucket;
        LicenseStatus status;
        uint64 updatedAt;
    }

    struct ServiceBinding {
        bytes32 passportId;
        bytes32 operatorAgentId;
        bytes32 endpointHash;
        bool available;
        uint64 updatedAt;
    }

    struct Receipt {
        bytes32 passportId;
        bytes32 licenseId;
        bytes32 serviceId;
        bytes32 requesterAgentId;
        bytes32 requestHash;
        bytes32 resultHash;
        bytes32 gateOutput;
        uint8 quotaStateOut;
        ReceiptStatus status;
        uint64 createdAt;
    }

    address public owner;
    mapping(address => bool) public controllers;

    mapping(bytes32 => Passport) private passports;
    mapping(bytes32 => License) private licenses;
    mapping(bytes32 => ServiceBinding) private services;
    mapping(bytes32 => Receipt) private receipts;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ControllerUpdated(address indexed controller, bool allowed);
    event PassportCreated(
        bytes32 indexed passportId,
        address indexed owner,
        bytes32 creatorProof,
        bytes32 serviceId,
        uint256 capabilityCircuitId
    );
    event PassportVersionUpdated(bytes32 indexed passportId, bytes32 versionHash);
    event PassportStatusUpdated(bytes32 indexed passportId, PassportStatus status);
    event PassportOwnershipTransferred(
        bytes32 indexed passportId,
        address indexed previousOwner,
        address indexed newOwner
    );
    event LicenseIssued(
        bytes32 indexed licenseId,
        bytes32 indexed passportId,
        bytes32 indexed licenseeAgentId,
        uint16 quota,
        uint8 royaltyBucket
    );
    event LicenseRevoked(bytes32 indexed licenseId);
    event QuotaStateRecorded(
        bytes32 indexed licenseId,
        uint8 stateOut,
        bytes32 receiptId
    );
    event ServiceBound(
        bytes32 indexed serviceId,
        bytes32 indexed passportId,
        bytes32 indexed operatorAgentId
    );
    event ServiceAvailabilityUpdated(bytes32 indexed serviceId, bool available);
    event ReceiptRecorded(
        bytes32 indexed receiptId,
        bytes32 indexed passportId,
        bytes32 indexed licenseId,
        ReceiptStatus status
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyController() {
        require(controllers[msg.sender], "not controller");
        _;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "zero owner");
        owner = initialOwner;
        controllers[initialOwner] = true;
        emit OwnershipTransferred(address(0), initialOwner);
        emit ControllerUpdated(initialOwner, true);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function setController(address controller, bool allowed) external onlyOwner {
        require(controller != address(0), "zero controller");
        controllers[controller] = allowed;
        emit ControllerUpdated(controller, allowed);
    }

    function createPassport(
        bytes32 passportId,
        bytes32 namespaceHash,
        bytes32 skillKeyHash,
        bytes32 versionHash,
        bytes32 creatorProof,
        address passportOwner,
        bytes32 serviceId,
        uint256 capabilityCircuitId
    ) external onlyController {
        require(passportId != bytes32(0), "zero passport");
        require(passports[passportId].owner == address(0), "passport exists");
        require(passportOwner != address(0), "zero passport owner");

        passports[passportId] = Passport({
            namespaceHash: namespaceHash,
            skillKeyHash: skillKeyHash,
            currentVersionHash: versionHash,
            creatorProof: creatorProof,
            owner: passportOwner,
            serviceId: serviceId,
            capabilityCircuitId: capabilityCircuitId,
            status: PassportStatus.PUBLISHED,
            updatedAt: uint64(block.timestamp)
        });

        emit PassportCreated(
            passportId,
            passportOwner,
            creatorProof,
            serviceId,
            capabilityCircuitId
        );
    }

    function updatePassportVersion(
        bytes32 passportId,
        bytes32 versionHash
    ) external onlyController {
        Passport storage passport = passports[passportId];
        require(passport.owner != address(0), "passport missing");
        require(versionHash != bytes32(0), "zero version");

        passport.currentVersionHash = versionHash;
        passport.updatedAt = uint64(block.timestamp);
        emit PassportVersionUpdated(passportId, versionHash);
    }

    function setPassportStatus(
        bytes32 passportId,
        PassportStatus status
    ) external onlyController {
        Passport storage passport = passports[passportId];
        require(passport.owner != address(0), "passport missing");

        passport.status = status;
        passport.updatedAt = uint64(block.timestamp);
        emit PassportStatusUpdated(passportId, status);
    }

    function transferPassportOwnership(
        bytes32 passportId,
        address newOwner
    ) external onlyController {
        Passport storage passport = passports[passportId];
        require(passport.owner != address(0), "passport missing");
        require(newOwner != address(0), "zero owner");

        address previousOwner = passport.owner;
        passport.owner = newOwner;
        passport.updatedAt = uint64(block.timestamp);
        emit PassportOwnershipTransferred(passportId, previousOwner, newOwner);
    }

    function issueLicense(
        bytes32 licenseId,
        bytes32 passportId,
        bytes32 licenseeAgentId,
        uint8 mode,
        uint16 quota,
        uint8 royaltyBucket
    ) external onlyController {
        Passport storage passport = passports[passportId];
        require(passport.owner != address(0), "passport missing");
        require(passport.status == PassportStatus.PUBLISHED, "passport inactive");
        require(licenseId != bytes32(0), "zero license");
        require(licenses[licenseId].passportId == bytes32(0), "license exists");
        require(licenseeAgentId != bytes32(0), "zero licensee");
        require(royaltyBucket <= 3, "bad royalty");

        licenses[licenseId] = License({
            passportId: passportId,
            licenseeAgentId: licenseeAgentId,
            mode: mode,
            quotaRemaining: quota,
            royaltyBucket: royaltyBucket,
            status: LicenseStatus.ACTIVE,
            updatedAt: uint64(block.timestamp)
        });

        emit LicenseIssued(
            licenseId,
            passportId,
            licenseeAgentId,
            quota,
            royaltyBucket
        );
    }

    function revokeLicense(bytes32 licenseId) external onlyController {
        License storage license = licenses[licenseId];
        require(license.passportId != bytes32(0), "license missing");

        license.status = LicenseStatus.REVOKED;
        license.updatedAt = uint64(block.timestamp);
        emit LicenseRevoked(licenseId);
    }

    function recordQuotaStep(
        bytes32 licenseId,
        uint8 stateOut,
        bytes32 receiptId
    ) external onlyController {
        License storage license = licenses[licenseId];
        require(license.passportId != bytes32(0), "license missing");
        require(license.status == LicenseStatus.ACTIVE, "license inactive");
        require(stateOut <= 15, "quota outside 4-bit state");

        license.quotaRemaining = stateOut;
        license.updatedAt = uint64(block.timestamp);
        emit QuotaStateRecorded(licenseId, stateOut, receiptId);
    }

    function bindService(
        bytes32 serviceId,
        bytes32 passportId,
        bytes32 operatorAgentId,
        bytes32 endpointHash,
        bool available
    ) external onlyController {
        require(serviceId != bytes32(0), "zero service");
        require(passports[passportId].owner != address(0), "passport missing");
        require(operatorAgentId != bytes32(0), "zero operator");

        services[serviceId] = ServiceBinding({
            passportId: passportId,
            operatorAgentId: operatorAgentId,
            endpointHash: endpointHash,
            available: available,
            updatedAt: uint64(block.timestamp)
        });

        emit ServiceBound(serviceId, passportId, operatorAgentId);
    }

    function setServiceAvailability(
        bytes32 serviceId,
        bool available
    ) external onlyController {
        ServiceBinding storage service = services[serviceId];
        require(service.passportId != bytes32(0), "service missing");

        service.available = available;
        service.updatedAt = uint64(block.timestamp);
        emit ServiceAvailabilityUpdated(serviceId, available);
    }

    function recordReceipt(
        bytes32 receiptId,
        bytes32 passportId,
        bytes32 licenseId,
        bytes32 serviceId,
        bytes32 requesterAgentId,
        bytes32 requestHash,
        bytes32 resultHash,
        bytes32 gateOutput,
        uint8 quotaStateOut,
        ReceiptStatus status
    ) external onlyController {
        require(receiptId != bytes32(0), "zero receipt");
        require(receipts[receiptId].passportId == bytes32(0), "receipt exists");
        require(passports[passportId].owner != address(0), "passport missing");
        require(licenses[licenseId].passportId == passportId, "license mismatch");
        require(quotaStateOut <= 15, "quota outside 4-bit state");

        receipts[receiptId] = Receipt({
            passportId: passportId,
            licenseId: licenseId,
            serviceId: serviceId,
            requesterAgentId: requesterAgentId,
            requestHash: requestHash,
            resultHash: resultHash,
            gateOutput: gateOutput,
            quotaStateOut: quotaStateOut,
            status: status,
            createdAt: uint64(block.timestamp)
        });

        emit ReceiptRecorded(receiptId, passportId, licenseId, status);
    }

    function getPassport(bytes32 passportId) external view returns (Passport memory) {
        Passport memory passport = passports[passportId];
        require(passport.owner != address(0), "passport missing");
        return passport;
    }

    function getLicense(bytes32 licenseId) external view returns (License memory) {
        License memory license = licenses[licenseId];
        require(license.passportId != bytes32(0), "license missing");
        return license;
    }

    function getService(bytes32 serviceId) external view returns (ServiceBinding memory) {
        ServiceBinding memory service = services[serviceId];
        require(service.passportId != bytes32(0), "service missing");
        return service;
    }

    function getReceipt(bytes32 receiptId) external view returns (Receipt memory) {
        Receipt memory receipt = receipts[receiptId];
        require(receipt.passportId != bytes32(0), "receipt missing");
        return receipt;
    }
}
