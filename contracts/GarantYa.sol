// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title Constants
/// @notice Shared constants used across the GarantYa protocol.
library Constants {
    uint256 internal constant MIN_DAYS          = 1;
    uint256 internal constant MAX_DAYS          = 1095;
    uint256 internal constant TENANT_WINDOW     = 7 days;
    uint256 internal constant ARBITRATOR_WINDOW = 30 days;
    uint256 internal constant CANCEL_WINDOW     = 24 hours;
    uint256 internal constant MAX_DEPOSIT       = 100 ether;
    uint256 internal constant MIN_DEPOSIT       = 0.01 ether;
}

/// @title GarantYa
/// @author GarantYa Protocol
/// @notice Escrow contract for rental security deposits.
/// @dev Holds AVAX on behalf of a tenant for the duration of a rental agreement.
///      The landlord proposes how to distribute the deposit at the end; the tenant
///      can accept, reject (triggering arbitration), or reclaim if the contract
///      expires without any proposal. Each instance is created by `GarantYaFactory`.
///
/// ## State Machine
/// ```
/// Created ──fund()──► Funded ──proposeDistribution()──► DistributionProposed
///                        │                                     │
///                        │ cancel()                  accept() │ reject()
///                        │ reclaimExpired()                    │
///                        ▼                             ┌───────┴────────┐
///                    Completed ◄──────────────────────┘    Disputed
///                        ▲                                     │
///                        └──resolve() / executeArbitratorTimeout()
/// ```
contract GarantYa is ReentrancyGuard, AccessControl {

    /// @notice Role identifier for the tenant.
    bytes32 public constant TENANT_ROLE     = keccak256("TENANT_ROLE");
    /// @notice Role identifier for the landlord.
    bytes32 public constant LANDLORD_ROLE   = keccak256("LANDLORD_ROLE");
    /// @notice Role identifier for the arbitrator.
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    /// @notice Lifecycle states of the escrow contract.
    enum State {
        /// @dev Deployed, waiting for the tenant to fund it.
        Created,
        /// @dev Tenant has deposited funds; cancel window is open.
        Funded,
        /// @dev Landlord has proposed a distribution; tenant must respond.
        DistributionProposed,
        /// @dev Tenant rejected the proposal; arbitrator must resolve.
        Disputed,
        /// @dev Funds have been allocated and are ready to withdraw.
        Completed,
        /// @dev Contract was cancelled before being funded.
        Cancelled
    }

    /// @notice A landlord's proposed split of the deposit.
    struct Proposal {
        /// @dev Amount allocated to the tenant (in wei).
        uint128 tenantAmount;
        /// @dev Amount allocated to the landlord (in wei).
        uint128 landlordAmount;
        /// @dev Timestamp when the proposal was submitted.
        uint256 proposedAt;
        /// @dev Timestamp when the tenant rejected the proposal (0 if not disputed).
        uint256 disputedAt;
    }

    /// @notice Final allocation amounts for each party once the contract is Completed.
    struct Allocation {
        /// @dev Amount the tenant can withdraw (in wei).
        uint128 tenant;
        /// @dev Amount the landlord can withdraw (in wei).
        uint128 landlord;
    }

    /// @notice Address of the tenant.
    address public immutable tenant;
    /// @notice Address of the landlord.
    address public immutable landlord;
    /// @notice Address of the arbitrator.
    address public immutable arbitrator;
    /// @notice Exact deposit amount the tenant must send, in wei.
    uint256 public immutable expectedDeposit;
    /// @notice Timestamp after which the tenant can reclaim funds if no proposal was made.
    uint256 public immutable contractDeadline;
    /// @notice Timestamp after which the landlord can cancel if the tenant never funded.
    uint256 public immutable fundDeadline;

    /// @notice Current state of the contract.
    State      public state;
    /// @notice Amount deposited by the tenant, in wei.
    uint256    public depositAmount;
    /// @notice Timestamp until which the tenant can cancel after funding.
    uint256    public cancelDeadline;
    /// @notice True once a distribution proposal has been submitted.
    bool       public proposalSubmitted;
    /// @notice The active distribution proposal.
    Proposal   public proposal;
    /// @notice Final allocation amounts for each party.
    Allocation public allocations;

    /// @notice Time window the tenant has to respond to a proposal.
    uint256 public constant TENANT_WINDOW     = Constants.TENANT_WINDOW;
    /// @notice Time window the arbitrator has to resolve a dispute.
    uint256 public constant ARBITRATOR_WINDOW = Constants.ARBITRATOR_WINDOW;
    /// @notice Time window the tenant has to cancel after funding.
    uint256 public constant CANCEL_WINDOW     = Constants.CANCEL_WINDOW;
    /// @notice Minimum contract duration in days.
    uint256 public constant MIN_DAYS          = Constants.MIN_DAYS;
    /// @notice Maximum contract duration in days.
    uint256 public constant MAX_DAYS          = Constants.MAX_DAYS;
    /// @notice Time window the tenant has to fund after deployment.
    uint256 public constant FUND_WINDOW       = 7 days;

    /// @notice Thrown when a zero address is provided.
    error ZeroAddress();
    /// @notice Thrown when tenant and landlord are the same address.
    error SameAddress();
    /// @notice Thrown when the arbitrator is one of the parties.
    error ArbitratorIsParty();
    /// @notice Thrown when the number of rental days is out of range.
    error InvalidDays();
    /// @notice Thrown when the deposit exceeds uint128 max value.
    error DepositExceedsUint128();
    /// @notice Thrown when the contract is not in the required state.
    /// @param current The current state.
    /// @param required The required state.
    error WrongState(State current, State required);
    /// @notice Thrown when the sent deposit does not match the expected amount.
    /// @param sent Amount sent by the caller.
    /// @param expected Amount expected.
    error WrongDeposit(uint256 sent, uint256 expected);
    /// @notice Thrown when the proposed distribution does not sum to the deposit.
    /// @param got Sum of the proposed amounts.
    /// @param expected The total deposit amount.
    error InvalidDistribution(uint256 got, uint256 expected);
    /// @notice Thrown when a time-locked action is called before its deadline.
    /// @param availableAt Timestamp when the action becomes available.
    error DeadlineNotReached(uint256 availableAt);
    /// @notice Thrown when the fund window has already expired.
    error FundWindowExpired();
    /// @notice Thrown when the tenant's response window has closed.
    error ResponseWindowClosed();
    /// @notice Thrown when the cancel window has closed.
    error CancelWindowClosed();
    /// @notice Thrown when a party attempts to withdraw with no funds allocated.
    error NothingToWithdraw();
    /// @notice Thrown when a withdrawal is attempted before the contract is Completed.
    /// @param current The current state.
    error WithdrawLocked(State current);
    /// @notice Thrown when a native token transfer fails.
    error TransferFailed();
    /// @notice Thrown when ETH is sent directly to the contract.
    error DirectTransfer();
    /// @notice Thrown when a second proposal is submitted.
    error ProposalAlreadySubmitted();
    /// @notice Thrown when rescue is called for an address that is not a party.
    error NotAnAllocatedParty();
    /// @notice Thrown when an allocation has already been withdrawn or rescued.
    error AllocationAlreadyWithdrawn();

    /// @notice Emitted when the contract is deployed.
    event ContractCreated(address indexed tenant, address indexed landlord, address indexed arbitrator, uint256 expectedDeposit, uint256 contractDeadline, uint256 fundDeadline);
    /// @notice Emitted when the tenant funds the escrow.
    event Funded(address indexed tenant, uint256 amount, uint256 cancelDeadline);
    /// @notice Emitted when the landlord submits a distribution proposal.
    event Proposed(address indexed landlord, uint256 tenantAmount, uint256 landlordAmount, uint256 expiresAt);
    /// @notice Emitted when the tenant accepts the proposal.
    event Accepted(address indexed tenant, uint256 tenantAmount, uint256 landlordAmount);
    /// @notice Emitted when the tenant rejects the proposal.
    event Rejected(address indexed tenant, uint256 disputedAt);
    /// @notice Emitted when the arbitrator resolves a dispute.
    event Resolved(address indexed arbitrator, uint256 tenantAmount, uint256 landlordAmount);
    /// @notice Emitted when the proposal timeout is executed by any party.
    event TimeoutExecuted(address indexed executor, uint256 tenantAmount, uint256 landlordAmount);
    /// @notice Emitted when the tenant reclaims funds after the arbitrator timeout expires.
    event ArbitratorTimeoutExecuted(address indexed tenant, uint256 amount);
    /// @notice Emitted when the tenant reclaims the deposit after the contract deadline.
    event Reclaimed(address indexed tenant, uint256 amount);
    /// @notice Emitted when the tenant cancels within the cancel window.
    event Cancelled(address indexed tenant, uint256 amount);
    /// @notice Emitted when the landlord cancels a never-funded contract.
    event CancelledPending(address indexed landlord);
    /// @notice Emitted when a party withdraws their allocation.
    event Withdrawn(address indexed recipient, uint256 amount);
    /// @notice Emitted when the arbitrator rescues a stuck allocation.
    event AllocationRescued(address indexed from, address indexed to, uint256 amount, address indexed arbitrator);

    /// @notice Deploys a new escrow contract.
    /// @param _tenant    Address of the tenant.
    /// @param _landlord  Address of the landlord.
    /// @param _arbitrator Address of the arbitrator (must differ from both parties).
    /// @param _expectedDeposit Exact deposit amount in wei (between MIN_DEPOSIT and MAX_DEPOSIT).
    /// @param _days Duration of the rental in days (between MIN_DAYS and MAX_DAYS).
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

    /// @dev Rejects plain ETH transfers; all funds must go through `fund()`.
    receive() external payable { revert DirectTransfer(); }

    /// @notice Funds the escrow with the exact deposit amount.
    /// @dev Only the tenant can call this within the fund window.
    ///      Sets a 24-hour cancel window after funding.
    function fund() external payable onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.Created) {
        if (block.timestamp > fundDeadline) revert FundWindowExpired();
        if (msg.value != expectedDeposit)   revert WrongDeposit(msg.value, expectedDeposit);
        depositAmount  = msg.value;
        cancelDeadline = block.timestamp + CANCEL_WINDOW;
        state          = State.Funded;
        emit Funded(msg.sender, msg.value, cancelDeadline);
    }

    /// @notice Cancels the contract after the fund window expires without funding.
    /// @dev Only callable by the landlord once `fundDeadline` has passed.
    function cancelPending() external onlyRole(LANDLORD_ROLE) onlyInState(State.Created) {
        if (block.timestamp <= fundDeadline) revert DeadlineNotReached(fundDeadline);
        state = State.Cancelled;
        emit CancelledPending(msg.sender);
    }

    /// @notice Cancels the contract and returns the full deposit to the tenant.
    /// @dev Only callable by the tenant within the 24-hour cancel window after funding.
    function cancel() external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.Funded) {
        if (block.timestamp > cancelDeadline) revert CancelWindowClosed();
        uint128 full = uint128(depositAmount);
        state = State.Completed;
        allocations.tenant += full;
        emit Cancelled(msg.sender, depositAmount);
    }

    /// @notice Proposes how to distribute the deposit between tenant and landlord.
    /// @dev Only callable once by the landlord while the contract is Funded.
    ///      The amounts must sum exactly to `depositAmount`.
    /// @param _tenantAmt   Amount to return to the tenant, in wei.
    /// @param _landlordAmt Amount to keep for the landlord, in wei.
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

    /// @notice Accepts the landlord's distribution proposal.
    /// @dev Only callable by the tenant within the 7-day response window.
    ///      Moves the contract to Completed and locks in the allocations.
    function accept() external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.DistributionProposed) {
        if (block.timestamp > proposal.proposedAt + TENANT_WINDOW) revert ResponseWindowClosed();
        uint128 ta = proposal.tenantAmount;
        uint128 la = proposal.landlordAmount;
        state = State.Completed;
        if (ta > 0) allocations.tenant   += ta;
        if (la > 0) allocations.landlord += la;
        emit Accepted(msg.sender, ta, la);
    }

    /// @notice Rejects the landlord's proposal and opens a dispute.
    /// @dev Only callable by the tenant within the 7-day response window.
    ///      The arbitrator then has 30 days to call `resolve()`.
    function reject() external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.DistributionProposed) {
        if (block.timestamp > proposal.proposedAt + TENANT_WINDOW) revert ResponseWindowClosed();
        proposal.disputedAt = block.timestamp;
        state = State.Disputed;
        emit Rejected(msg.sender, block.timestamp);
    }

    /// @notice Resolves a dispute and sets the final allocation.
    /// @dev Only callable by the arbitrator while the contract is Disputed.
    ///      The amounts must sum exactly to `depositAmount`.
    /// @param _tenantAmt   Amount to allocate to the tenant, in wei.
    /// @param _landlordAmt Amount to allocate to the landlord, in wei.
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

    /// @notice Executes the proposal automatically if the tenant did not respond in time.
    /// @dev Callable by anyone after the 7-day tenant window expires.
    ///      Moves the contract to Completed with the landlord's proposed amounts.
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

    /// @notice Allows the tenant to reclaim the full deposit if the arbitrator fails to resolve.
    /// @dev Callable by the tenant after the 30-day arbitrator window expires.
    ///      Penalises an unresponsive arbitrator by returning all funds to the tenant.
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

    /// @notice Allows the tenant to reclaim the full deposit after the contract deadline expires.
    /// @dev Callable when the contract is still Funded and `contractDeadline` has passed,
    ///      meaning the landlord never proposed a distribution.
    function reclaimExpired() external onlyRole(TENANT_ROLE) nonReentrant onlyInState(State.Funded) {
        if (block.timestamp < contractDeadline) revert DeadlineNotReached(contractDeadline);
        uint128 full = uint128(depositAmount);
        state = State.Completed;
        allocations.tenant += full;
        emit Reclaimed(msg.sender, depositAmount);
    }

    /// @notice Withdraws the caller's allocated funds after the contract is Completed.
    /// @dev Only the tenant and landlord can withdraw their respective allocations.
    ///      Uses a pull-payment pattern to avoid reentrancy risks.
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

    /// @notice Allows the arbitrator to redirect a party's allocation to a different address.
    /// @dev Intended as a last-resort recovery if a party's wallet is compromised or unreachable.
    /// @param _recipient The party whose allocation to rescue (must be tenant or landlord).
    /// @param _to        The address that will receive the funds.
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

    /// @notice Returns the amount currently held in escrow.
    function lockedBalance() external view returns (uint256) { return depositAmount; }

    /// @notice Returns the number of hours remaining in the fund window.
    /// @return 0 if the window has expired or the contract is already funded.
    function hoursToFund() external view returns (uint256) {
        if (state != State.Created) return 0;
        if (block.timestamp >= fundDeadline) return 0;
        unchecked { return (fundDeadline - block.timestamp) / 1 hours; }
    }

    /// @notice Returns the tenant's remaining time to respond to a proposal.
    /// @return hours_ Hours remaining; 0 if expired or no proposal.
    /// @return hasProposal True if a proposal exists.
    function hoursToRespond() external view returns (uint256 hours_, bool hasProposal) {
        if (state != State.DistributionProposed) return (0, false);
        uint256 expiresAt = proposal.proposedAt + TENANT_WINDOW;
        if (block.timestamp >= expiresAt) return (0, true);
        unchecked { return ((expiresAt - block.timestamp) / 1 hours, true); }
    }

    /// @notice Returns the number of days until the contract deadline.
    /// @return 0 if the deadline has already passed.
    function daysUntilDeadline() external view returns (uint256) {
        if (block.timestamp >= contractDeadline) return 0;
        unchecked { return (contractDeadline - block.timestamp) / 1 days; }
    }

    /// @notice Returns true if the fund window has expired without the tenant funding.
    function isFundWindowExpired() external view returns (bool) {
        return state == State.Created && block.timestamp > fundDeadline;
    }

    /// @notice Returns true if the arbitrator window has expired without resolution.
    function isArbitratorWindowExpired() external view returns (bool) {
        return state == State.Disputed && block.timestamp > proposal.disputedAt + ARBITRATOR_WINDOW;
    }

    /// @notice Returns the current state as a human-readable string.
    function stateLabel() external view returns (string memory) {
        if (state == State.Created)              return "Created";
        if (state == State.Funded)               return "Funded";
        if (state == State.DistributionProposed) return "DistributionProposed";
        if (state == State.Disputed)             return "Disputed";
        if (state == State.Cancelled)            return "Cancelled";
        return "Completed";
    }

    /// @notice Returns the contract version.
    function version() external pure returns (string memory) { return "8.0.0"; }
}

/// @title GarantYaFactory
/// @author GarantYa Protocol
/// @notice Factory contract that deploys and indexes `GarantYa` escrow instances.
/// @dev The deployer becomes the factory owner and sets a global arbitrator address.
///      Landlords call `deployContract()` to create a new escrow for a specific tenant.
///      The factory tracks contracts by landlord and tenant for easy lookup.
///
///      Fee mechanism: `feeBps` (default 1%) is recorded on-chain but is NOT yet
///      collected automatically — it is reserved for a future protocol upgrade.
contract GarantYaFactory is Ownable2Step, Pausable {

    /// @notice Minimum rental duration in days.
    uint256 public constant MIN_DAYS            = Constants.MIN_DAYS;
    /// @notice Maximum rental duration in days.
    uint256 public constant MAX_DAYS            = Constants.MAX_DAYS;
    /// @notice Minimum deposit amount in wei.
    uint256 public constant MIN_DEPOSIT         = Constants.MIN_DEPOSIT;
    /// @notice Maximum deposit amount in wei.
    uint256 public constant MAX_DEPOSIT         = Constants.MAX_DEPOSIT;
    /// @notice Timelock before a new arbitrator can be confirmed, in seconds.
    uint256 public constant ARBITRATOR_TIMELOCK = 48 hours;
    /// @notice Maximum protocol fee in basis points (5%).
    uint256 public constant MAX_FEE_BPS         = 500;
    /// @notice Maximum number of results returned per page in view functions.
    uint256 public constant MAX_PAGE_SIZE       = 100;

    /// @notice Address of the global arbitrator for all escrow contracts.
    address public globalArbitrator;
    /// @notice Protocol fee in basis points (100 = 1%).
    uint256 public feeBps = 100;
    /// @notice Total number of escrow contracts deployed through this factory.
    uint256 public totalContracts;
    /// @notice Pending arbitrator address waiting for timelock confirmation.
    address public pendingArbitrator;
    /// @notice Timestamp when the pending arbitrator can be confirmed.
    uint256 public pendingArbitratorAt;

    mapping(address => address[]) private _byTenant;
    mapping(address => address[]) private _byLandlord;

    /// @notice Returns true if the address is a contract deployed by this factory.
    mapping(address => bool) public isValidContract;

    /// @notice Thrown when a zero address is provided.
    error ZeroAddress();
    /// @notice Thrown when tenant and landlord are the same address.
    error SameAddress();
    /// @notice Thrown when the arbitrator is one of the parties.
    error ArbitratorIsParty();
    /// @notice Thrown when the deposit is below the minimum.
    error DepositTooLow(uint256 sent, uint256 min);
    /// @notice Thrown when the deposit exceeds the maximum.
    error DepositTooHigh(uint256 sent, uint256 max);
    /// @notice Thrown when the rental duration is out of range.
    error DaysOutOfRange();
    /// @notice Thrown when the proposed fee exceeds MAX_FEE_BPS.
    error FeeTooHigh(uint256 got, uint256 max);
    /// @notice Thrown when confirmation is attempted before the timelock expires.
    error TimelockActive(uint256 availableAt);
    /// @notice Thrown when there is no pending arbitrator to confirm or cancel.
    error NoPendingArbitrator();
    /// @notice Thrown when `withdrawFees()` is called with no balance.
    error NoFunds();
    /// @notice Thrown when a native token transfer fails.
    error TransferFailed();
    /// @notice Thrown when ETH is sent directly to the factory.
    error DirectTransfer();

    /// @notice Emitted when the factory is deployed.
    event FactoryDeployed(address indexed arbitrator, address indexed owner);
    /// @notice Emitted when a new GarantYa escrow is deployed.
    event ContractDeployed(address indexed contract_, address indexed landlord, address indexed tenant, uint256 expectedDeposit);
    /// @notice Emitted when a new arbitrator is proposed.
    event ArbitratorProposed(address indexed proposed, uint256 availableAt);
    /// @notice Emitted when the pending arbitrator is confirmed.
    event ArbitratorConfirmed(address indexed previous, address indexed current);
    /// @notice Emitted when the pending arbitrator proposal is cancelled.
    event ArbitratorCancelled(address indexed cancelled);
    /// @notice Emitted when the protocol fee is updated.
    event FeeUpdated(uint256 previous, uint256 current);
    /// @notice Emitted when accumulated fees are withdrawn by the owner.
    event FundsWithdrawn(address indexed to, uint256 amount);

    /// @notice Deploys the factory and sets the initial global arbitrator.
    /// @param _arbitrator Address of the global arbitrator (must not be zero).
    constructor(address _arbitrator) Ownable(msg.sender) {
        if (_arbitrator == address(0)) revert ZeroAddress();
        globalArbitrator = _arbitrator;
        emit FactoryDeployed(_arbitrator, msg.sender);
    }

    /// @dev Rejects plain ETH transfers.
    receive() external payable { revert DirectTransfer(); }
    fallback() external payable { revert DirectTransfer(); }

    /// @notice Deploys a new GarantYa escrow contract.
    /// @dev The caller becomes the landlord; `globalArbitrator` is assigned automatically.
    ///      If `_days` is 0 it defaults to `MIN_DAYS`.
    /// @param _tenant          Address of the tenant.
    /// @param _expectedDeposit Exact deposit amount the tenant must send, in wei.
    /// @param _days            Rental duration in days (0 defaults to MIN_DAYS).
    /// @return addr            Address of the newly deployed GarantYa contract.
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

    /// @notice Proposes a new global arbitrator (subject to a 48-hour timelock).
    /// @param _new Address of the proposed arbitrator.
    function proposeArbitrator(address _new) external onlyOwner {
        if (_new == address(0)) revert ZeroAddress();
        pendingArbitrator   = _new;
        pendingArbitratorAt = block.timestamp + ARBITRATOR_TIMELOCK;
        emit ArbitratorProposed(_new, pendingArbitratorAt);
    }

    /// @notice Confirms the pending arbitrator after the timelock has expired.
    function confirmArbitrator() external onlyOwner {
        if (pendingArbitrator == address(0))       revert NoPendingArbitrator();
        if (block.timestamp < pendingArbitratorAt) revert TimelockActive(pendingArbitratorAt);
        address prev        = globalArbitrator;
        globalArbitrator    = pendingArbitrator;
        pendingArbitrator   = address(0);
        pendingArbitratorAt = 0;
        emit ArbitratorConfirmed(prev, globalArbitrator);
    }

    /// @notice Cancels the pending arbitrator proposal.
    function cancelArbitrator() external onlyOwner {
        if (pendingArbitrator == address(0)) revert NoPendingArbitrator();
        address cancelled   = pendingArbitrator;
        pendingArbitrator   = address(0);
        pendingArbitratorAt = 0;
        emit ArbitratorCancelled(cancelled);
    }

    /// @notice Updates the protocol fee.
    /// @param _bps New fee in basis points (max 500 = 5%).
    function updateFee(uint256 _bps) external onlyOwner {
        if (_bps > MAX_FEE_BPS) revert FeeTooHigh(_bps, MAX_FEE_BPS);
        emit FeeUpdated(feeBps, _bps);
        feeBps = _bps;
    }

    /// @notice Withdraws all accumulated protocol fees to the owner.
    function withdrawFees() external onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoFunds();
        (bool ok, ) = payable(owner()).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit FundsWithdrawn(owner(), amount);
    }

    /// @notice Returns a paginated list of escrow contracts for a tenant.
    /// @param _t      Tenant address.
    /// @param _offset Starting index.
    /// @param _limit  Maximum number of results (capped at MAX_PAGE_SIZE).
    function getContractsByTenant(address _t, uint256 _offset, uint256 _limit)
        external view returns (address[] memory)
    {
        if (_limit > MAX_PAGE_SIZE) _limit = MAX_PAGE_SIZE;
        return _paginate(_byTenant[_t], _offset, _limit);
    }

    /// @notice Returns a paginated list of escrow contracts for a landlord.
    /// @param _l      Landlord address.
    /// @param _offset Starting index.
    /// @param _limit  Maximum number of results (capped at MAX_PAGE_SIZE).
    function getContractsByLandlord(address _l, uint256 _offset, uint256 _limit)
        external view returns (address[] memory)
    {
        if (_limit > MAX_PAGE_SIZE) _limit = MAX_PAGE_SIZE;
        return _paginate(_byLandlord[_l], _offset, _limit);
    }

    /// @notice Returns the total number of escrow contracts for a tenant.
    function totalByTenant(address _t)   external view returns (uint256) { return _byTenant[_t].length; }
    /// @notice Returns the total number of escrow contracts for a landlord.
    function totalByLandlord(address _l) external view returns (uint256) { return _byLandlord[_l].length; }
    /// @notice Returns true if the factory is paused.
    function isPaused()                  external view returns (bool)    { return paused(); }
    /// @notice Returns the contract version.
    function version()                   external pure returns (string memory) { return "8.0.0"; }
    /// @notice Pauses the factory, preventing new escrow deployments.
    function pause()   external onlyOwner { _pause(); }
    /// @notice Unpauses the factory.
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
