/**
 * Builds a standard UPI deep link string.
 * upi://pay?pa=<upi_id>&pn=<name>&am=<amount>&cu=INR&tn=<note>
 */
export function buildUpiLink({ upiId, amount, payeeName = 'Odoo Cafe', note = 'Order Payment' }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}
