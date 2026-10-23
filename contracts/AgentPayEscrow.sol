// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title AgentPayEscrow
/// @notice Escrow contract for AI-agent payments settled in USDC on Arc-compatible EVM networks.
contract AgentPayEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Escrow lifecycle statuses.
    enum EscrowStatus {
        Funded,
        Released,
        Refunded,
        Disputed
    }

    /// @notice Escrow data model.
    /// @param payer Address funding the escrow.
    /// @param payee Address receiving funds when released.
    /// @param amount USDC amount held in escrow.
    /// @param status Current escrow status.
    /// @param createdAt Unix timestamp when escrow was created.
    struct Escrow {
        address payer;
        address payee;
        uint256 amount;
        EscrowStatus status;
        uint256 createdAt;
    }

    /// @notice Thrown when an escrow does not exist.
    error EscrowNotFound();

    /// @notice Thrown when an escrow is not in Funded status.
    error EscrowNotFunded();

    /// @notice Thrown when caller is not authorized for requested action.
    error Unauthorized();

    /// @notice Thrown when trying to create an escrow with an existing ID.
    error AlreadyExists();

    /// @notice Thrown when a zero address is provided where forbidden.
    error ZeroAddress();

    /// @notice Thrown when a zero amount is provided where forbidden.
    error ZeroAmount();

    /// @notice Emitted when a new escrow is funded.
    /// @param escrowId Unique escrow identifier.
    /// @param payer Address that funded the escrow.
    /// @param payee Address designated to receive funds.
    /// @param amount Amount of USDC escrowed.
    event EscrowCreated(uint256 indexed escrowId, address indexed payer, address indexed payee, uint256 amount);

    /// @notice Emitted when escrow funds are released to the payee.
    /// @param escrowId Escrow identifier.
    event EscrowReleased(uint256 indexed escrowId);

    /// @notice Emitted when escrow funds are refunded to the payer.
    /// @param escrowId Escrow identifier.
    event EscrowRefunded(uint256 indexed escrowId);

    /// @notice Emitted when a dispute is opened for an escrow.
    /// @param escrowId Escrow identifier.
    event DisputeOpened(uint256 indexed escrowId);

    /// @notice Emitted when the arbiter address is updated.
    /// @param arbiter New arbiter address.
    event ArbiterUpdated(address indexed arbiter);

    /// @notice USDC token used for escrow settlement.
    IERC20 public immutable usdc;

    /// @notice Address allowed to resolve disputed escrows.
    address public arbiter;

    /// @notice Escrow records keyed by escrow ID.
    mapping(uint256 => Escrow) public escrows;

    /// @param _usdc USDC token address used for all escrow transfers.
    constructor(address _usdc) Ownable(msg.sender) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
    }

    /// @notice Creates and funds a new escrow.
    /// @dev Caller must approve this contract to transfer `amount` USDC before calling.
    /// @param escrowId Unique escrow identifier.
    /// @param payee Recipient address for release.
    /// @param amount Amount of USDC to escrow.
    function createEscrow(uint256 escrowId, address payee, uint256 amount) external nonReentrant {
        if (payee == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (escrows[escrowId].payer != address(0)) revert AlreadyExists();

        escrows[escrowId] = Escrow({
            payer: msg.sender,
            payee: payee,
            amount: amount,
            status: EscrowStatus.Funded,
            createdAt: block.timestamp
        });

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit EscrowCreated(escrowId, msg.sender, payee, amount);
    }

    /// @notice Releases escrowed funds to the payee.
    /// @dev In normal flow only payer can release. In disputed flow only arbiter can release.
    /// @param escrowId Escrow identifier.
    function releaseFunds(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = _getEscrowOrRevert(escrowId);

        if (escrow.status == EscrowStatus.Funded) {
            if (msg.sender != escrow.payer) revert Unauthorized();
        } else if (escrow.status == EscrowStatus.Disputed) {
            if (msg.sender != arbiter) revert Unauthorized();
        } else {
            revert EscrowNotFunded();
        }

        escrow.status = EscrowStatus.Released;
        usdc.safeTransfer(escrow.payee, escrow.amount);

        emit EscrowReleased(escrowId);
    }

    /// @notice Refunds escrowed funds to the payer.
    /// @dev In normal flow only payer can refund. In disputed flow only arbiter can refund.
    /// @param escrowId Escrow identifier.
    function refund(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = _getEscrowOrRevert(escrowId);

        if (escrow.status == EscrowStatus.Funded) {
            if (msg.sender != escrow.payer) revert Unauthorized();
        } else if (escrow.status == EscrowStatus.Disputed) {
            if (msg.sender != arbiter) revert Unauthorized();
        } else {
            revert EscrowNotFunded();
        }

        escrow.status = EscrowStatus.Refunded;
        usdc.safeTransfer(escrow.payer, escrow.amount);

        emit EscrowRefunded(escrowId);
    }

    /// @notice Opens a dispute for a funded escrow.
    /// @dev Only payer or payee can open a dispute.
    /// @param escrowId Escrow identifier.
    function openDispute(uint256 escrowId) external {
        Escrow storage escrow = _getEscrowOrRevert(escrowId);

        if (escrow.status != EscrowStatus.Funded) revert EscrowNotFunded();
        if (msg.sender != escrow.payer && msg.sender != escrow.payee) revert Unauthorized();

        escrow.status = EscrowStatus.Disputed;

        emit DisputeOpened(escrowId);
    }

    /// @notice Sets the arbiter address.
    /// @param _arbiter Address authorized to resolve disputes.
    function setArbiter(address _arbiter) external onlyOwner {
        if (_arbiter == address(0)) revert ZeroAddress();
        arbiter = _arbiter;

        emit ArbiterUpdated(_arbiter);
    }

    /// @notice Returns complete escrow details.
    /// @param escrowId Escrow identifier.
    /// @return payer Escrow payer.
    /// @return payee Escrow payee.
    /// @return amount Escrow amount.
    /// @return status Escrow status.
    /// @return createdAt Escrow creation timestamp.
    function getEscrow(uint256 escrowId)
        external
        view
        returns (address payer, address payee, uint256 amount, EscrowStatus status, uint256 createdAt)
    {
        Escrow storage escrow = _getEscrowOrRevert(escrowId);
        return (escrow.payer, escrow.payee, escrow.amount, escrow.status, escrow.createdAt);
    }

    /// @notice Returns escrow storage reference or reverts if missing.
    /// @param escrowId Escrow identifier.
    /// @return escrow Escrow storage reference.
    function _getEscrowOrRevert(uint256 escrowId) internal view returns (Escrow storage escrow) {
        escrow = escrows[escrowId];
        if (escrow.payer == address(0)) revert EscrowNotFound();
    }
}
