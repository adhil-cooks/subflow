"""Strict financial calculations using exact Decimal arithmetic.

No floating-point math is used for monetary values.
"""
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Tuple

TWO_PLACES = Decimal("0.01")


def to_decimal(value: Any) -> Decimal:
    """Safely convert any numeric representation (str, int, Decimal) to Decimal.
    
    Avoids float conversion precision issues by rejecting floats or converting them strictly via string.
    """
    if isinstance(value, float):
        # Convert float via string representation to avoid immediate binary representation artifacts
        return Decimal(str(value)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    elif isinstance(value, Decimal):
        return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    elif isinstance(value, (int, str)):
        return Decimal(str(value)).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    else:
        raise TypeError(f"Cannot convert type {type(value)} to Decimal currency")


def calculate_line_item(
    quantity: int,
    unit_price: Decimal,
    tax_rate: Decimal = Decimal("0.00")
) -> Tuple[Decimal, Decimal, Decimal]:
    """Calculate line item subtotal, tax amount, and total.
    
    Returns:
        (line_subtotal, line_tax, line_total)
    """
    if quantity <= 0:
        raise ValueError(f"Quantity must be greater than zero, got {quantity}")
    
    unit_price = to_decimal(unit_price)
    tax_rate = to_decimal(tax_rate)
    
    if unit_price < Decimal("0.00"):
        raise ValueError("Unit price cannot be negative")
    if tax_rate < Decimal("0.00"):
        raise ValueError("Tax rate cannot be negative")
        
    line_subtotal = (Decimal(quantity) * unit_price).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    line_tax = (line_subtotal * (tax_rate / Decimal("100.00"))).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    line_total = line_subtotal + line_tax
    return line_subtotal, line_tax, line_total


def calculate_invoice_totals(
    items: List[Dict[str, Any]],
    discount_amount: Decimal = Decimal("0.00")
) -> Dict[str, Decimal]:
    """Calculate invoice aggregates from item snapshots.
    
    Returns dictionary with subtotal, tax_amount, discount_amount, and total_amount.
    """
    subtotal = Decimal("0.00")
    tax_amount = Decimal("0.00")
    discount = to_decimal(discount_amount)
    
    for item in items:
        qty = item.get("quantity", 1)
        price = to_decimal(item["unit_price"])
        rate = to_decimal(item.get("tax_rate", "0.00"))
        
        line_sub, line_tax, _ = calculate_line_item(qty, price, rate)
        subtotal += line_sub
        tax_amount += line_tax
        
    subtotal = subtotal.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    tax_amount = tax_amount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    
    if discount > (subtotal + tax_amount):
        # Cap discount to invoice amount
        discount = subtotal + tax_amount
        
    total_amount = (subtotal + tax_amount - discount).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
    
    return {
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "discount_amount": discount,
        "total_amount": total_amount,
    }


def calculate_outstanding_balance(total_amount: Decimal, amount_paid: Decimal) -> Decimal:
    """Calculate the remaining unpaid balance on an invoice."""
    total = to_decimal(total_amount)
    paid = to_decimal(amount_paid)
    balance = total - paid
    return max(Decimal("0.00"), balance).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)
