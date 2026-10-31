"""Billing domain types, enums, and state machine validation."""
from enum import Enum
from typing import Set, Dict


class SubscriptionStatus(str, Enum):
    TRIALING = "trialing"
    ACTIVE = "active"
    PAUSED = "paused"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"


class BillingInterval(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    VOID = "void"
    UNCOLLECTIBLE = "uncollectible"


class PaymentMethod(str, Enum):
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    OTHER = "other"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"


# Valid subscription state transitions
ALLOWED_SUBSCRIPTION_TRANSITIONS: Dict[SubscriptionStatus, Set[SubscriptionStatus]] = {
    SubscriptionStatus.TRIALING: {
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELLED,
    },
    SubscriptionStatus.ACTIVE: {
        SubscriptionStatus.PAUSED,
        SubscriptionStatus.PAST_DUE,
        SubscriptionStatus.CANCELLED,
    },
    SubscriptionStatus.PAUSED: {
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELLED,
    },
    SubscriptionStatus.PAST_DUE: {
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELLED,
    },
    SubscriptionStatus.CANCELLED: set(),  # Terminal state
}


class InvalidStatusTransitionError(ValueError):
    """Raised when an invalid subscription status transition is attempted."""
    pass


def validate_subscription_transition(current: SubscriptionStatus, target: SubscriptionStatus) -> None:
    """Validate that moving from current to target status is permitted.
    
    Raises:
        InvalidStatusTransitionError: If the transition is disallowed.
    """
    if current == target:
        return
        
    allowed = ALLOWED_SUBSCRIPTION_TRANSITIONS.get(current, set())
    if target not in allowed:
        allowed_names = [s.value for s in allowed] or ["None (terminal state)"]
        raise InvalidStatusTransitionError(
            f"Invalid subscription status transition from '{current.value}' to '{target.value}'. "
            f"Allowed transitions from '{current.value}': {', '.join(allowed_names)}."
        )
