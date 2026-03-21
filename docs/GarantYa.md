# Solidity API

## Constants

Shared constants used across the GarantYa protocol.

### MIN_DAYS

```solidity
uint256 MIN_DAYS
```

### MAX_DAYS

```solidity
uint256 MAX_DAYS
```

### TENANT_WINDOW

```solidity
uint256 TENANT_WINDOW
```

### ARBITRATOR_WINDOW

```solidity
uint256 ARBITRATOR_WINDOW
```

### CANCEL_WINDOW

```solidity
uint256 CANCEL_WINDOW
```

### MAX_DEPOSIT

```solidity
uint256 MAX_DEPOSIT
```

### MIN_DEPOSIT

```solidity
uint256 MIN_DEPOSIT
```

## GarantYa

Escrow contract for rental security deposits.

_Holds AVAX on behalf of a tenant for the duration of a rental agreement.
     The landlord proposes how to distribute the deposit at the end; the tenant
     can accept, reject (triggering arbitration), or reclaim if the contract
     expires without any proposal. Each instance is created by `GarantYaFactory`.

## State Machine
```
Created ──fund()──► Funded ──proposeDistribution()──► DistributionProposed
                       │                                     │
                       │ cancel()                  accept() │ reject()
                       │ reclaimExpired()                    │
                       ▼                             ┌───────┴────────┐
                   Completed ◄──────────────────────┘    Disputed
                       ▲                                     │
                       └──resolve() / executeArbitratorTimeout()
```_

### TENANT_ROLE

```solidity
bytes32 TENANT_ROLE
```

Role identifier for the tenant.

### LANDLORD_ROLE

```solidity
bytes32 LANDLORD_ROLE
```

Role identifier for the landlord.

### ARBITRATOR_ROLE

```solidity
bytes32 ARBITRATOR_ROLE
```

Role identifier for the arbitrator.

### State

Lifecycle states of the escrow contract.

```solidity
enum State {
  Created,
  Funded,
  DistributionProposed,
  Disputed,
  Completed,
  Cancelled
}
```

### Proposal

A landlord's proposed split of the deposit.

```solidity
struct Proposal {
  uint128 tenantAmount;
  uint128 landlordAmount;
  uint256 proposedAt;
  uint256 disputedAt;
}
```

### Allocation

Final allocation amounts for each party once the contract is Completed.

```solidity
struct Allocation {
  uint128 tenant;
  uint128 landlord;
}
```

### tenant

```solidity
address tenant
```

Address of the tenant.

### landlord

```solidity
address landlord
```

Address of the landlord.

### arbitrator

```solidity
address arbitrator
```

Address of the arbitrator.

### expectedDeposit

```solidity
uint256 expectedDeposit
```

Exact deposit amount the tenant must send, in wei.

### contractDeadline

```solidity
uint256 contractDeadline
```

Timestamp after which the tenant can reclaim funds if no proposal was made.

### fundDeadline

```solidity
uint256 fundDeadline
```

Timestamp after which the landlord can cancel if the tenant never funded.

### state

```solidity
enum GarantYa.State state
```

Current state of the contract.

### depositAmount

```solidity
uint256 depositAmount
```

Amount deposited by the tenant, in wei.

### cancelDeadline

```solidity
uint256 cancelDeadline
```

Timestamp until which the tenant can cancel after funding.

### proposalSubmitted

```solidity
bool proposalSubmitted
```

True once a distribution proposal has been submitted.

### proposal

```solidity
struct GarantYa.Proposal proposal
```

The active distribution proposal.

### allocations

```solidity
struct GarantYa.Allocation allocations
```

Final allocation amounts for each party.

### TENANT_WINDOW

```solidity
uint256 TENANT_WINDOW
```

Time window the tenant has to respond to a proposal.

### ARBITRATOR_WINDOW

```solidity
uint256 ARBITRATOR_WINDOW
```

Time window the arbitrator has to resolve a dispute.

### CANCEL_WINDOW

```solidity
uint256 CANCEL_WINDOW
```

Time window the tenant has to cancel after funding.

### MIN_DAYS

```solidity
uint256 MIN_DAYS
```

Minimum contract duration in days.

### MAX_DAYS

```solidity
uint256 MAX_DAYS
```

Maximum contract duration in days.

### FUND_WINDOW

```solidity
uint256 FUND_WINDOW
```

Time window the tenant has to fund after deployment.

### ZeroAddress

```solidity
error ZeroAddress()
```

Thrown when a zero address is provided.

### SameAddress

```solidity
error SameAddress()
```

Thrown when tenant and landlord are the same address.

### ArbitratorIsParty

```solidity
error ArbitratorIsParty()
```

Thrown when the arbitrator is one of the parties.

### InvalidDays

```solidity
error InvalidDays()
```

Thrown when the number of rental days is out of range.

### DepositExceedsUint128

```solidity
error DepositExceedsUint128()
```

Thrown when the deposit exceeds uint128 max value.

### WrongState

```solidity
error WrongState(enum GarantYa.State current, enum GarantYa.State required)
```

Thrown when the contract is not in the required state.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| current | enum GarantYa.State | The current state. |
| required | enum GarantYa.State | The required state. |

### WrongDeposit

```solidity
error WrongDeposit(uint256 sent, uint256 expected)
```

Thrown when the sent deposit does not match the expected amount.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| sent | uint256 | Amount sent by the caller. |
| expected | uint256 | Amount expected. |

### InvalidDistribution

```solidity
error InvalidDistribution(uint256 got, uint256 expected)
```

Thrown when the proposed distribution does not sum to the deposit.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| got | uint256 | Sum of the proposed amounts. |
| expected | uint256 | The total deposit amount. |

### DeadlineNotReached

```solidity
error DeadlineNotReached(uint256 availableAt)
```

Thrown when a time-locked action is called before its deadline.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| availableAt | uint256 | Timestamp when the action becomes available. |

### FundWindowExpired

```solidity
error FundWindowExpired()
```

Thrown when the fund window has already expired.

### ResponseWindowClosed

```solidity
error ResponseWindowClosed()
```

Thrown when the tenant's response window has closed.

### CancelWindowClosed

```solidity
error CancelWindowClosed()
```

Thrown when the cancel window has closed.

### NothingToWithdraw

```solidity
error NothingToWithdraw()
```

Thrown when a party attempts to withdraw with no funds allocated.

### WithdrawLocked

```solidity
error WithdrawLocked(enum GarantYa.State current)
```

Thrown when a withdrawal is attempted before the contract is Completed.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| current | enum GarantYa.State | The current state. |

### TransferFailed

```solidity
error TransferFailed()
```

Thrown when a native token transfer fails.

### DirectTransfer

```solidity
error DirectTransfer()
```

Thrown when ETH is sent directly to the contract.

### ProposalAlreadySubmitted

```solidity
error ProposalAlreadySubmitted()
```

Thrown when a second proposal is submitted.

### NotAnAllocatedParty

```solidity
error NotAnAllocatedParty()
```

Thrown when rescue is called for an address that is not a party.

### AllocationAlreadyWithdrawn

```solidity
error AllocationAlreadyWithdrawn()
```

Thrown when an allocation has already been withdrawn or rescued.

### ContractCreated

```solidity
event ContractCreated(address tenant, address landlord, address arbitrator, uint256 expectedDeposit, uint256 contractDeadline, uint256 fundDeadline)
```

Emitted when the contract is deployed.

### Funded

```solidity
event Funded(address tenant, uint256 amount, uint256 cancelDeadline)
```

Emitted when the tenant funds the escrow.

### Proposed

```solidity
event Proposed(address landlord, uint256 tenantAmount, uint256 landlordAmount, uint256 expiresAt)
```

Emitted when the landlord submits a distribution proposal.

### Accepted

```solidity
event Accepted(address tenant, uint256 tenantAmount, uint256 landlordAmount)
```

Emitted when the tenant accepts the proposal.

### Rejected

```solidity
event Rejected(address tenant, uint256 disputedAt)
```

Emitted when the tenant rejects the proposal.

### Resolved

```solidity
event Resolved(address arbitrator, uint256 tenantAmount, uint256 landlordAmount)
```

Emitted when the arbitrator resolves a dispute.

### TimeoutExecuted

```solidity
event TimeoutExecuted(address executor, uint256 tenantAmount, uint256 landlordAmount)
```

Emitted when the proposal timeout is executed by any party.

### ArbitratorTimeoutExecuted

```solidity
event ArbitratorTimeoutExecuted(address tenant, uint256 amount)
```

Emitted when the tenant reclaims funds after the arbitrator timeout expires.

### Reclaimed

```solidity
event Reclaimed(address tenant, uint256 amount)
```

Emitted when the tenant reclaims the deposit after the contract deadline.

### Cancelled

```solidity
event Cancelled(address tenant, uint256 amount)
```

Emitted when the tenant cancels within the cancel window.

### CancelledPending

```solidity
event CancelledPending(address landlord)
```

Emitted when the landlord cancels a never-funded contract.

### Withdrawn

```solidity
event Withdrawn(address recipient, uint256 amount)
```

Emitted when a party withdraws their allocation.

### AllocationRescued

```solidity
event AllocationRescued(address from, address to, uint256 amount, address arbitrator)
```

Emitted when the arbitrator rescues a stuck allocation.

### constructor

```solidity
constructor(address _tenant, address _landlord, address _arbitrator, uint256 _expectedDeposit, uint256 _days) public
```

Deploys a new escrow contract.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tenant | address | Address of the tenant. |
| _landlord | address | Address of the landlord. |
| _arbitrator | address | Address of the arbitrator (must differ from both parties). |
| _expectedDeposit | uint256 | Exact deposit amount in wei (between MIN_DEPOSIT and MAX_DEPOSIT). |
| _days | uint256 | Duration of the rental in days (between MIN_DAYS and MAX_DAYS). |

### onlyInState

```solidity
modifier onlyInState(enum GarantYa.State _s)
```

### receive

```solidity
receive() external payable
```

_Rejects plain ETH transfers; all funds must go through `fund()`._

### fund

```solidity
function fund() external payable
```

Funds the escrow with the exact deposit amount.

_Only the tenant can call this within the fund window.
     Sets a 24-hour cancel window after funding._

### cancelPending

```solidity
function cancelPending() external
```

Cancels the contract after the fund window expires without funding.

_Only callable by the landlord once `fundDeadline` has passed._

### cancel

```solidity
function cancel() external
```

Cancels the contract and returns the full deposit to the tenant.

_Only callable by the tenant within the 24-hour cancel window after funding._

### proposeDistribution

```solidity
function proposeDistribution(uint256 _tenantAmt, uint256 _landlordAmt) external
```

Proposes how to distribute the deposit between tenant and landlord.

_Only callable once by the landlord while the contract is Funded.
     The amounts must sum exactly to `depositAmount`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tenantAmt | uint256 | Amount to return to the tenant, in wei. |
| _landlordAmt | uint256 | Amount to keep for the landlord, in wei. |

### accept

```solidity
function accept() external
```

Accepts the landlord's distribution proposal.

_Only callable by the tenant within the 7-day response window.
     Moves the contract to Completed and locks in the allocations._

### reject

```solidity
function reject() external
```

Rejects the landlord's proposal and opens a dispute.

_Only callable by the tenant within the 7-day response window.
     The arbitrator then has 30 days to call `resolve()`._

### resolve

```solidity
function resolve(uint256 _tenantAmt, uint256 _landlordAmt) external
```

Resolves a dispute and sets the final allocation.

_Only callable by the arbitrator while the contract is Disputed.
     The amounts must sum exactly to `depositAmount`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tenantAmt | uint256 | Amount to allocate to the tenant, in wei. |
| _landlordAmt | uint256 | Amount to allocate to the landlord, in wei. |

### executeTimeout

```solidity
function executeTimeout() external
```

Executes the proposal automatically if the tenant did not respond in time.

_Callable by anyone after the 7-day tenant window expires.
     Moves the contract to Completed with the landlord's proposed amounts._

### executeArbitratorTimeout

```solidity
function executeArbitratorTimeout() external
```

Allows the tenant to reclaim the full deposit if the arbitrator fails to resolve.

_Callable by the tenant after the 30-day arbitrator window expires.
     Penalises an unresponsive arbitrator by returning all funds to the tenant._

### reclaimExpired

```solidity
function reclaimExpired() external
```

Allows the tenant to reclaim the full deposit after the contract deadline expires.

_Callable when the contract is still Funded and `contractDeadline` has passed,
     meaning the landlord never proposed a distribution._

### withdraw

```solidity
function withdraw() external
```

Withdraws the caller's allocated funds after the contract is Completed.

_Only the tenant and landlord can withdraw their respective allocations.
     Uses a pull-payment pattern to avoid reentrancy risks._

### rescueAllocation

```solidity
function rescueAllocation(address _recipient, address _to) external
```

Allows the arbitrator to redirect a party's allocation to a different address.

_Intended as a last-resort recovery if a party's wallet is compromised or unreachable._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _recipient | address | The party whose allocation to rescue (must be tenant or landlord). |
| _to | address | The address that will receive the funds. |

### lockedBalance

```solidity
function lockedBalance() external view returns (uint256)
```

Returns the amount currently held in escrow.

### hoursToFund

```solidity
function hoursToFund() external view returns (uint256)
```

Returns the number of hours remaining in the fund window.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the window has expired or the contract is already funded. |

### hoursToRespond

```solidity
function hoursToRespond() external view returns (uint256 hours_, bool hasProposal)
```

Returns the tenant's remaining time to respond to a proposal.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| hours_ | uint256 | Hours remaining; 0 if expired or no proposal. |
| hasProposal | bool | True if a proposal exists. |

### daysUntilDeadline

```solidity
function daysUntilDeadline() external view returns (uint256)
```

Returns the number of days until the contract deadline.

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | 0 if the deadline has already passed. |

### isFundWindowExpired

```solidity
function isFundWindowExpired() external view returns (bool)
```

Returns true if the fund window has expired without the tenant funding.

### isArbitratorWindowExpired

```solidity
function isArbitratorWindowExpired() external view returns (bool)
```

Returns true if the arbitrator window has expired without resolution.

### stateLabel

```solidity
function stateLabel() external view returns (string)
```

Returns the current state as a human-readable string.

### version

```solidity
function version() external pure returns (string)
```

Returns the contract version.

## GarantYaFactory

Factory contract that deploys and indexes `GarantYa` escrow instances.

_The deployer becomes the factory owner and sets a global arbitrator address.
     Landlords call `deployContract()` to create a new escrow for a specific tenant.
     The factory tracks contracts by landlord and tenant for easy lookup.

     Fee mechanism: `feeBps` (default 1%) is recorded on-chain but is NOT yet
     collected automatically — it is reserved for a future protocol upgrade._

### MIN_DAYS

```solidity
uint256 MIN_DAYS
```

Minimum rental duration in days.

### MAX_DAYS

```solidity
uint256 MAX_DAYS
```

Maximum rental duration in days.

### MIN_DEPOSIT

```solidity
uint256 MIN_DEPOSIT
```

Minimum deposit amount in wei.

### MAX_DEPOSIT

```solidity
uint256 MAX_DEPOSIT
```

Maximum deposit amount in wei.

### ARBITRATOR_TIMELOCK

```solidity
uint256 ARBITRATOR_TIMELOCK
```

Timelock before a new arbitrator can be confirmed, in seconds.

### MAX_FEE_BPS

```solidity
uint256 MAX_FEE_BPS
```

Maximum protocol fee in basis points (5%).

### MAX_PAGE_SIZE

```solidity
uint256 MAX_PAGE_SIZE
```

Maximum number of results returned per page in view functions.

### globalArbitrator

```solidity
address globalArbitrator
```

Address of the global arbitrator for all escrow contracts.

### feeBps

```solidity
uint256 feeBps
```

Protocol fee in basis points (100 = 1%).

### totalContracts

```solidity
uint256 totalContracts
```

Total number of escrow contracts deployed through this factory.

### pendingArbitrator

```solidity
address pendingArbitrator
```

Pending arbitrator address waiting for timelock confirmation.

### pendingArbitratorAt

```solidity
uint256 pendingArbitratorAt
```

Timestamp when the pending arbitrator can be confirmed.

### isValidContract

```solidity
mapping(address => bool) isValidContract
```

Returns true if the address is a contract deployed by this factory.

### ZeroAddress

```solidity
error ZeroAddress()
```

Thrown when a zero address is provided.

### SameAddress

```solidity
error SameAddress()
```

Thrown when tenant and landlord are the same address.

### ArbitratorIsParty

```solidity
error ArbitratorIsParty()
```

Thrown when the arbitrator is one of the parties.

### DepositTooLow

```solidity
error DepositTooLow(uint256 sent, uint256 min)
```

Thrown when the deposit is below the minimum.

### DepositTooHigh

```solidity
error DepositTooHigh(uint256 sent, uint256 max)
```

Thrown when the deposit exceeds the maximum.

### DaysOutOfRange

```solidity
error DaysOutOfRange()
```

Thrown when the rental duration is out of range.

### FeeTooHigh

```solidity
error FeeTooHigh(uint256 got, uint256 max)
```

Thrown when the proposed fee exceeds MAX_FEE_BPS.

### TimelockActive

```solidity
error TimelockActive(uint256 availableAt)
```

Thrown when confirmation is attempted before the timelock expires.

### NoPendingArbitrator

```solidity
error NoPendingArbitrator()
```

Thrown when there is no pending arbitrator to confirm or cancel.

### NoFunds

```solidity
error NoFunds()
```

Thrown when `withdrawFees()` is called with no balance.

### TransferFailed

```solidity
error TransferFailed()
```

Thrown when a native token transfer fails.

### DirectTransfer

```solidity
error DirectTransfer()
```

Thrown when ETH is sent directly to the factory.

### FactoryDeployed

```solidity
event FactoryDeployed(address arbitrator, address owner)
```

Emitted when the factory is deployed.

### ContractDeployed

```solidity
event ContractDeployed(address contract_, address landlord, address tenant, uint256 expectedDeposit)
```

Emitted when a new GarantYa escrow is deployed.

### ArbitratorProposed

```solidity
event ArbitratorProposed(address proposed, uint256 availableAt)
```

Emitted when a new arbitrator is proposed.

### ArbitratorConfirmed

```solidity
event ArbitratorConfirmed(address previous, address current)
```

Emitted when the pending arbitrator is confirmed.

### ArbitratorCancelled

```solidity
event ArbitratorCancelled(address cancelled)
```

Emitted when the pending arbitrator proposal is cancelled.

### FeeUpdated

```solidity
event FeeUpdated(uint256 previous, uint256 current)
```

Emitted when the protocol fee is updated.

### FundsWithdrawn

```solidity
event FundsWithdrawn(address to, uint256 amount)
```

Emitted when accumulated fees are withdrawn by the owner.

### constructor

```solidity
constructor(address _arbitrator) public
```

Deploys the factory and sets the initial global arbitrator.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _arbitrator | address | Address of the global arbitrator (must not be zero). |

### receive

```solidity
receive() external payable
```

_Rejects plain ETH transfers._

### fallback

```solidity
fallback() external payable
```

### deployContract

```solidity
function deployContract(address _tenant, uint256 _expectedDeposit, uint256 _days) external returns (address addr)
```

Deploys a new GarantYa escrow contract.

_The caller becomes the landlord; `globalArbitrator` is assigned automatically.
     If `_days` is 0 it defaults to `MIN_DAYS`._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tenant | address | Address of the tenant. |
| _expectedDeposit | uint256 | Exact deposit amount the tenant must send, in wei. |
| _days | uint256 | Rental duration in days (0 defaults to MIN_DAYS). |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | Address of the newly deployed GarantYa contract. |

### proposeArbitrator

```solidity
function proposeArbitrator(address _new) external
```

Proposes a new global arbitrator (subject to a 48-hour timelock).

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _new | address | Address of the proposed arbitrator. |

### confirmArbitrator

```solidity
function confirmArbitrator() external
```

Confirms the pending arbitrator after the timelock has expired.

### cancelArbitrator

```solidity
function cancelArbitrator() external
```

Cancels the pending arbitrator proposal.

### updateFee

```solidity
function updateFee(uint256 _bps) external
```

Updates the protocol fee.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _bps | uint256 | New fee in basis points (max 500 = 5%). |

### withdrawFees

```solidity
function withdrawFees() external
```

Withdraws all accumulated protocol fees to the owner.

### getContractsByTenant

```solidity
function getContractsByTenant(address _t, uint256 _offset, uint256 _limit) external view returns (address[])
```

Returns a paginated list of escrow contracts for a tenant.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _t | address | Tenant address. |
| _offset | uint256 | Starting index. |
| _limit | uint256 | Maximum number of results (capped at MAX_PAGE_SIZE). |

### getContractsByLandlord

```solidity
function getContractsByLandlord(address _l, uint256 _offset, uint256 _limit) external view returns (address[])
```

Returns a paginated list of escrow contracts for a landlord.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _l | address | Landlord address. |
| _offset | uint256 | Starting index. |
| _limit | uint256 | Maximum number of results (capped at MAX_PAGE_SIZE). |

### totalByTenant

```solidity
function totalByTenant(address _t) external view returns (uint256)
```

Returns the total number of escrow contracts for a tenant.

### totalByLandlord

```solidity
function totalByLandlord(address _l) external view returns (uint256)
```

Returns the total number of escrow contracts for a landlord.

### isPaused

```solidity
function isPaused() external view returns (bool)
```

Returns true if the factory is paused.

### version

```solidity
function version() external pure returns (string)
```

Returns the contract version.

### pause

```solidity
function pause() external
```

Pauses the factory, preventing new escrow deployments.

### unpause

```solidity
function unpause() external
```

Unpauses the factory.

### _paginate

```solidity
function _paginate(address[] _arr, uint256 _offset, uint256 _limit) internal view returns (address[] result)
```

