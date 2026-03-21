// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

library Constants {
    uint256 internal constant MIN_DAYS          = 1;
    uint256 internal constant MAX_DAYS          = 1095;
    uint256 internal constant TENANT_WINDOW     = 7 days;
    uint256 internal constant ARBITRATOR_WINDOW = 30 days;
    uint256 internal constant CANCEL_WINDOW     = 24 hours;
    uint256 internal constant MAX_DEPOSIT       = 100 ether;
    uint256 internal constant MIN_DEPOSIT       = 0.01 ether;
}

contract GarantYa is ReentrancyGuard, AccessControl {

    bytes32 public constant TENANT_ROLE     = keccak256("TENANT_ROLE");
    bytes32 public constant LANDLORD_ROLE   = keccak256("LANDLORD_ROLE");
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    enum State {
        Created,
        Funded,
        DistributionProposed,
        Disputed,
        Completed,
        Cancelled
    }

    struct Proposal {
        uint128 tenantAmount;
        uint128 landlordAmount;
        uint256 proposedAt;
        uint256 disputedAt;
    }

    struct Allocation {
        uint128 tenant;
        uint128 landlord;
    }

    address public immutable tenant;
    address public immutable landlord;
    address public immutable arbitrator;
    uint256 public immutable expectedDeposit;
    uint256 public immutable contractDeadline;
    uint256 public immutable fundDeadline;

    State      public state;
    uint256    public depositAmount;
    uint256    public cancelDeadline;
    bool       public proposalSubmitted;
    Proposal   public proposal;
    Allocation public allocations;

    uint256 public constant TENANT_WINDOW     = Constants.TENANT_WINDOW;
    uint256 public constant ARBITRATOR_WINDOW = Constants.ARBITRATOR_WINDOW;
    uint256 public constant CANCEL_WINDOW     = Constants.CANCEL_WINDOW;
    uint256 public constant MIN_DAYS          = Constants.MIN_DAYS;
    uint256 public constant MAX_DAYS          = Constants.MAX_DAYS;
    uint256 public constant FUND_WINDOW       = 7 days;

    error ZeroAddress();
    error SameAddress();
    error ArbitratorIsParty();
    error InvalidDays();
    error DepositExceedsUint128();
    error WrongState(State current, State required);
    error WrongDeposit(uint256 sent, uint256 expected);
    error InvalidDistribution(uint256 got, uint256 expected);
    error DeadlineNotReached(uint256 availableAt);
    error FundWindowExpired();
    error ResponseWindowClosed();
    error CancelWindowClosed();
    error NothingToWithdraw();
    error WithdrawLocked(State current);
    error TransferFailed();
    error ProposalAlreadySubmitted();
    error NotAnAllocatedParty();
    error AllocationAlreadyWithdrawn();
    error DirectTransfer();

    event ContractCreated(address indexed tenant, address indexed landlord, address indexed arbitrator, uint256 expectedDeposit, uint256 contractDeadline, uint256 fundDeadline);
    event Funded(address indexed tenant, uint256 amount, uint256 cancelDeadline);
    event Proposed(address indexed landlord, uint256 tenantAmount, uint256 landlordAmount, uint256 expiresAt);
    event Accepted(address indexed tenant, uint256 tenantAmount, uint256 landlordAmount);
    event Rejected(address indexed tenant, uint256 disputedAt);
    event Resolved(address indexed arbitrator, uint256 tenantAmount, uint256 landlordAmount);
    event TimeoutExecuted(address indexed executor, uint256 tenantAmount, uint256 landlordAmount);
    event ArbitratorTimeoutExecuted(address indexed tenant, uint256 amount);
    event Reclaimed(address indexed tenant, uint256 amount);
    event Cancelled(address indexed tenant, uint256 amount);
    event CancelledPending(address indexed landlord);
    event Withdrawn(address indexed recipient, uint256 amount);
    event AllocationRescued(address indexed from, address indexed to, uint256 amount, address indexed arbitrator);

    constructor(
        address _tenant,
        address _landlord,
        address _arbitrator,
        uint256 _expectedDeposit,
        uint256 _days
    ) {
        if (_tenant          == address(0)) revert ZeroAddress();
        if (_landlord        == address(0)) revert ZeroAddress();
        if (_arbitrator      == address(0)) revert ZeroAddress();
        if (_expectedDeposit == 0)          revert WrongDeposit(0, 1);
        if (_tenant          == _landlord)  revert SameAddress();
        if (_arbitrator      == _tenant)    revert ArbitratorIsParty();
        if (_arbitrator      == _landlord)  revert ArbitratorIsParty();
        if (_days < MIN_DAYS || _days > MAX_DAYS) revert InvalidDays();
        if (_expectedDeposit < Constants.MIN_DEPOSIT) revert WrongDeposit(_expectedDeposit, Constants.MIN_DEPOSIT);
        if (_expectedDeposit > Constants.MAX_DEPOSIT) revert WrongDeposit(_expectedDeposit, Constants.MAX_DEPOSIT);
        if (_expectedDeposit > type(uint128).max)     revert DepositExceedsUint128();

        tenant           = _tenant;
        landlord         = _landlord;
        arbitrator       = _arbitrator;
        expectedDeposit  = _expectedDeposit;
        contractDeadline = block.timestamp + (_days * 1 days);
        fundDeadline     = block.timestamp + FUND_WINDOW;
        state            = State.Created;

        _grantRole(TENANT_ROLE,     _tenant);
        _grantRole(LANDLORD_ROLE,   _landlord);
        _grantRole(ARBITRATOR_ROLE, _arbitrator);
        _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);

        emit ContractCreated(_tenant, _landlord, _arbitrator, _expectedDeposit, contractDeadline, fundDeadline);
    }

    modifier onlyInState(State _s) {
        if (state != _s) revert WrongState(state, _s);
        _;
    }

    receive() external payable { revert DirectTransfer(); }

    function fund() external payable onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.Created) {
        if (block.timestamp > fundDeadline) revert FundWindowExpired();
        if (msg.value != expectedDeposit)   revert WrongDeposit(msg.value, expectedDeposit);
        depositAmount  = msg.value;
        cancelDeadline = block.timestamp + CANCEL_WINDOW;
        state          = State.Funded;
        emit Funded(msg.sender, msg.value, cancelDeadline);
    }

    function cancelPending() external onlyRole(LANDLORD_ROLE) onlyInState(State.Created) {
        if (block.timestamp <= fundDeadline) revert DeadlineNotReached(fundDeadline);
        state = State.Cancelled;
        emit CancelledPending(msg.sender);
    }

    function cancel() external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.Funded) {
        if (block.timestamp > cancelDeadline) revert CancelWindowClosed();
        uint128 full = uint128(depositAmount);
        state = State.Completed;
        allocations.tenant += full;
        emit Cancelled(msg.sender, depositAmount);
    }

    function proposeDistribution(uint256 _tenantAmt, uint256 _landlordAmt)
        external onlyRole(LANDLORD_ROLE) nonReentrant onlyInState(State.Funded)
    {
        if (proposalSubmitted) revert ProposalAlreadySubmitted();
        unchecked {
            if (_tenantAmt + _landlordAmt != depositAmount)
                revert InvalidDistribution(_tenantAmt + _landlordAmt, depositAmount);
        }
        proposalSubmitted = true;
        state = State.DistributionProposed;
        proposal = Proposal({
            tenantAmount:   uint128(_tenantAmt),
            landlordAmount: uint128(_landlordAmt),
            proposedAt:     block.timestamp,
            disputedAt:     0
        });
        emit Proposed(msg.sender, _tenantAmt, _landlordAmt, block.timestamp + TENANT_WINDOW);
    }

    function accept() external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.DistributionProposed) {
        if (block.timestamp > proposal.proposedAt + TENANT_WINDOW) revert ResponseWindowClosed();
        uint128 ta = proposal.tenantAmount;
        uint128 la = proposal.landlordAmount;
        state = State.Completed;
        if (ta > 0) allocations.tenant   += ta;
        if (la > 0) allocations.landlord += la;
        emit Accepted(msg.sender, ta, la);
    }

    function reject() external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.DistributionProposed) {
        if (block.timestamp > proposal.proposedAt + TENANT_WINDOW) revert ResponseWindowClosed();
        proposal.disputedAt = block.timestamp;
        state = State.Disputed;
        emit Rejected(msg.sender, block.timestamp);
    }

    function resolve(uint256 _tenantAmt, uint256 _landlordAmt)
        external onlyRole(ARBITRATOR_ROLE) nonReentrant onlyInState(State.Disputed)
    {
        unchecked {
            if (_tenantAmt + _landlordAmt != depositAmount)
                revert InvalidDistribution(_tenantAmt + _landlordAmt, depositAmount);
        }
        state = State.Completed;
        if (_tenantAmt   > 0) allocations.tenant   += uint128(_tenantAmt);
        if (_landlordAmt > 0) allocations.landlord += uint128(_landlordAmt);
        emit Resolved(msg.sender, _tenantAmt, _landlordAmt);
    }

    function executeTimeout() external nonReentrant onlyInState(State.DistributionProposed) {
        uint256 expiresAt = proposal.proposedAt + TENANT_WINDOW;
        if (block.timestamp <= expiresAt) revert DeadlineNotReached(expiresAt);
        uint128 ta = proposal.tenantAmount;
        uint128 la = proposal.landlordAmount;
        state = State.Completed;
        if (ta > 0) allocations.tenant   += ta;
        if (la > 0) allocations.landlord += la;
        emit TimeoutExecuted(msg.sender, ta, la);
    }

    function executeArbitratorTimeout()
        external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.Disputed)
    {
        uint256 deadline = proposal.disputedAt + ARBITRATOR_WINDOW;
        if (block.timestamp <= deadline) revert DeadlineNotReached(deadline);
        uint128 full = uint128(depositAmount);
        state = State.Completed;
        allocations.tenant += full;
        emit ArbitratorTimeoutExecuted(msg.sender, depositAmount);
    }

    function reclaimExpired() external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.Funded) {
        if (block.timestamp < contractDeadline) revert DeadlineNotReached(contractDeadline);
        uint128 full = uint128(depositAmount);
        state = State.Completed;
        allocations.tenant += full;
        emit Reclaimed(msg.sender, depositAmount);
    }

    function withdraw() external nonReentrant {
        if (state != State.Completed) revert WithdrawLocked(state);
        uint256 amount;
        if (msg.sender == tenant) {
            amount = allocations.tenant;
            if (amount == 0) revert NothingToWithdraw();
            allocations.tenant = 0;
        } else if (msg.sender == landlord) {
            amount = allocations.landlord;
            if (amount == 0) revert NothingToWithdraw();
            allocations.landlord = 0;
        } else {
            revert NothingToWithdraw();
        }
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(msg.sender, amount);
    }

    function rescueAllocation(address _recipient, address _to)
        external onlyRole(ARBITRATOR_ROLE) nonReentrant
    {
        if (state != State.Completed) revert WithdrawLocked(state);
        if (_to == address(0)) revert ZeroAddress();
        uint256 amount;
        if (_recipient == tenant) {
            amount = allocations.tenant;
            if (amount == 0) revert AllocationAlreadyWithdrawn();
            allocations.tenant = 0;
        } else if (_recipient == landlord) {
            amount = allocations.landlord;
            if (amount == 0) revert AllocationAlreadyWithdrawn();
            allocations.landlord = 0;
        } else {
            revert NotAnAllocatedParty();
        }
        (bool ok, ) = payable(_to).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit AllocationRescued(_recipient, _to, amount, msg.sender);
    }

    function lockedBalance() external view returns (uint256) { return depositAmount; }
    function hoursToFund() external view returns (uint256) {
        if (state != State.Created) return 0;
        if (block.timestamp >= fundDeadline) return 0;
        unchecked { return (fundDeadline - block.timestamp) / 1 hours; }
    }
    function hoursToRespond() external view returns (uint256 hours_, bool hasProposal) {
        if (state != State.DistributionProposed) return (0, false);
        uint256 expiresAt = proposal.proposedAt + TENANT_WINDOW;
        if (block.timestamp >= expiresAt) return (0, true);
        unchecked { return ((expiresAt - block.timestamp) / 1 hours, true); }
    }
    function daysUntilDeadline() external view returns (uint256) {
        if (block.timestamp >= contractDeadline) return 0;
        unchecked { return (contractDeadline - block.timestamp) / 1 days; }
    }
    function isFundWindowExpired() external view returns (bool) {
        return state == State.Created && block.timestamp > fundDeadline;
    }
    function isArbitratorWindowExpired() external view returns (bool) {
        return state == State.Disputed && block.timestamp > proposal.disputedAt + ARBITRATOR_WINDOW;
    }
    function stateLabel() external view returns (string memory) {
        if (state == State.Created)              return "Created";
        if (state == State.Funded)               return "Funded";
        if (state == State.DistributionProposed) return "DistributionProposed";
        if (state == State.Disputed)             return "Disputed";
        if (state == State.Cancelled)            return "Cancelled";
        return "Completed";
    }
    function version() external pure returns (string memory) { return "8.0.0"; }
}

contract GarantYaFactory is Ownable2Step, Pausable {

    uint256 public constant MIN_DAYS            = Constants.MIN_DAYS;
    uint256 public constant MAX_DAYS            = Constants.MAX_DAYS;
    uint256 public constant MIN_DEPOSIT         = Constants.MIN_DEPOSIT;
    uint256 public constant MAX_DEPOSIT         = Constants.MAX_DEPOSIT;
    uint256 public constant ARBITRATOR_TIMELOCK = 48 hours;
    uint256 public constant MAX_FEE_BPS         = 500;
    uint256 public constant MAX_PAGE_SIZE       = 100;

    address public globalArbitrator;
    uint256 public feeBps = 100;
    uint256 public totalContracts;
    address public pendingArbitrator;
    uint256 public pendingArbitratorAt;

    mapping(address => address[]) private _byTenant;
    mapping(address => address[]) private _byLandlord;
    mapping(address => bool)      public  isValidContract;

    error ZeroAddress();
    error SameAddress();
    error ArbitratorIsParty();
    error DepositTooLow(uint256 sent, uint256 min);
    error DepositTooHigh(uint256 sent, uint256 max);
    error DaysOutOfRange();
    error FeeTooHigh(uint256 got, uint256 max);
    error TimelockActive(uint256 availableAt);
    error NoPendingArbitrator();
    error NoFunds();
    error TransferFailed();
    error DirectTransfer();

    event FactoryDeployed(address indexed arbitrator, address indexed owner);
    event ContractDeployed(address indexed contract_, address indexed landlord, address indexed tenant, uint256 expectedDeposit);
    event ArbitratorProposed(address indexed proposed, uint256 availableAt);
    event ArbitratorConfirmed(address indexed previous, address indexed current);
    event ArbitratorCancelled(address indexed cancelled);
    event FeeUpdated(uint256 previous, uint256 current);
    event FundsWithdrawn(address indexed to, uint256 amount);

    constructor(address _arbitrator) Ownable(msg.sender) {
        if (_arbitrator == address(0)) revert ZeroAddress();
        globalArbitrator = _arbitrator;
        emit FactoryDeployed(_arbitrator, msg.sender);
    }

    receive() external payable { revert DirectTransfer(); }
    fallback() external payable { revert DirectTransfer(); }

    function deployContract(address _tenant, uint256 _expectedDeposit, uint256 _days)
        external whenNotPaused returns (address addr)
    {
        if (_expectedDeposit < MIN_DEPOSIT) revert DepositTooLow(_expectedDeposit, MIN_DEPOSIT);
        if (_expectedDeposit > MAX_DEPOSIT) revert DepositTooHigh(_expectedDeposit, MAX_DEPOSIT);
        if (_tenant == address(0))          revert ZeroAddress();
        if (_tenant == msg.sender)          revert SameAddress();
        if (_tenant == globalArbitrator || msg.sender == globalArbitrator) revert ArbitratorIsParty();

        uint256 days_ = _days == 0 ? MIN_DAYS : _days;
        if (days_ > MAX_DAYS) revert DaysOutOfRange();

        GarantYa escrow = new GarantYa(_tenant, msg.sender, globalArbitrator, _expectedDeposit, days_);
        addr = address(escrow);
        _byTenant[_tenant].push(addr);
        _byLandlord[msg.sender].push(addr);
        isValidContract[addr] = true;
        unchecked { ++totalContracts; }
        emit ContractDeployed(addr, msg.sender, _tenant, _expectedDeposit);
    }

    function proposeArbitrator(address _new) external onlyOwner {
        if (_new == address(0)) revert ZeroAddress();
        pendingArbitrator   = _new;
        pendingArbitratorAt = block.timestamp + ARBITRATOR_TIMELOCK;
        emit ArbitratorProposed(_new, pendingArbitratorAt);
    }

    function confirmArbitrator() external onlyOwner {
        if (pendingArbitrator == address(0))       revert NoPendingArbitrator();
        if (block.timestamp < pendingArbitratorAt) revert TimelockActive(pendingArbitratorAt);
        address prev        = globalArbitrator;
        globalArbitrator    = pendingArbitrator;
        pendingArbitrator   = address(0);
        pendingArbitratorAt = 0;
        emit ArbitratorConfirmed(prev, globalArbitrator);
    }

    function cancelArbitrator() external onlyOwner {
        if (pendingArbitrator == address(0)) revert NoPendingArbitrator();
        address cancelled   = pendingArbitrator;
        pendingArbitrator   = address(0);
        pendingArbitratorAt = 0;
        emit ArbitratorCancelled(cancelled);
    }

    function updateFee(uint256 _bps) external onlyOwner {
        if (_bps > MAX_FEE_BPS) revert FeeTooHigh(_bps, MAX_FEE_BPS);
        emit FeeUpdated(feeBps, _bps);
        feeBps = _bps;
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoFunds();
        (bool ok, ) = payable(owner()).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit FundsWithdrawn(owner(), amount);
    }

    function getContractsByTenant(address _t, uint256 _offset, uint256 _limit)
        external view returns (address[] memory)
    {
        if (_limit > MAX_PAGE_SIZE) _limit = MAX_PAGE_SIZE;
        return _paginate(_byTenant[_t], _offset, _limit);
    }

    function getContractsByLandlord(address _l, uint256 _offset, uint256 _limit)
        external view returns (address[] memory)
    {
        if (_limit > MAX_PAGE_SIZE) _limit = MAX_PAGE_SIZE;
        return _paginate(_byLandlord[_l], _offset, _limit);
    }

    function totalByTenant(address _t)   external view returns (uint256) { return _byTenant[_t].length; }
    function totalByLandlord(address _l) external view returns (uint256) { return _byLandlord[_l].length; }
    function isPaused()                  external view returns (bool)    { return paused(); }
    function version()                   external pure returns (string memory) { return "8.0.0"; }
    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _paginate(address[] storage _arr, uint256 _offset, uint256 _limit)
        internal view returns (address[] memory result)
    {
        if (_offset >= _arr.length) return new address[](0);
        uint256 end = _offset + _limit > _arr.length ? _arr.length : _offset + _limit;
        result = new address[](end - _offset);
        for (uint256 i = _offset; i < end;) {
            result[i - _offset] = _arr[i];
            unchecked { ++i; }
        }
    }
}