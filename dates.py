"""Billing interval and period date calculations."""
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from src.billing.types import BillingInterval


def calculate_period_end(start_date: datetime, interval: BillingInterval) -> datetime:
    """Calculate the period end date for a given start date and billing interval.
    
    Weekly: +7 days
    Monthly: +1 month
    Quarterly: +3 months
    Yearly: +1 year
    """
    if interval == BillingInterval.WEEKLY:
        return start_date + timedelta(days=7)
    elif interval == BillingInterval.MONTHLY:
        return start_date + relativedelta(months=1)
    elif interval == BillingInterval.QUARTERLY:
        return start_date + relativedelta(months=3)
    elif interval == BillingInterval.YEARLY:
        return start_date + relativedelta(years=1)
    else:
        raise ValueError(f"Unsupported billing interval: {interval}")


def calculate_next_billing_date(current_period_end: datetime) -> datetime:
    """Calculate the next billing date.
    
    By default in prepaid subscription models, the next billing date aligns with 
    the current period end date.
    """
    return current_period_end


def calculate_initial_dates(start_date: datetime, interval: BillingInterval) -> dict:
    """Calculate the initial subscription lifecycle dates."""
    period_end = calculate_period_end(start_date, interval)
    next_billing = calculate_next_billing_date(period_end)
    return {
        "start_date": start_date,
        "current_period_start": start_date,
        "current_period_end": period_end,
        "next_billing_date": next_billing,
    }
