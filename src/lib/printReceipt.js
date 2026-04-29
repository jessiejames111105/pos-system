import { escapeHtml, openPrintPdf } from './printPdf';

const formatPeso = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const openPrintReceipt = ({ transaction }) => {
  if (!transaction) return;
  const date = transaction.date ? new Date(transaction.date) : new Date();
  const dateText = Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  const paymentText = String(transaction.paymentMethod || '');
  const referenceNumber = transaction.referenceNumber ?? transaction.reference_number ?? null;
  const isCashMethod =
    paymentText.toLowerCase().includes('cash') ||
    transaction.cashReceived != null ||
    transaction.changeAmount != null;
  const cashReceived = transaction.cashReceived == null && isCashMethod ? Number(transaction.total || 0) : transaction.cashReceived;
  const changeAmount =
    transaction.changeAmount == null && isCashMethod
      ? Math.max(0, Number(cashReceived || 0) - Number(transaction.total || 0))
      : transaction.changeAmount;

  const itemsHtml = (transaction.items || [])
    .map((item) => {
      const qty = Number(item.quantity || 0);
      const unit = Number(item.price || 0);
      const lineTotal = unit * qty;
      const addonsHtml = (item.addons || [])
        .filter(a => Number(a.quantity || 0) > 0)
        .map(a => `<div class="xs muted">+ ${escapeHtml(a.name)} x${escapeHtml(a.quantity)} (${escapeHtml(formatPeso(a.price))})</div>`)
        .join('');

      return `
        <tr>
          <td>
            <div><strong>${escapeHtml(item.name)}</strong></div>
            <div class="xs muted">${escapeHtml(`${qty}x @ ${formatPeso(unit)}`)}</div>
            ${item.details ? `<div class="xs muted">${escapeHtml(String(item.details))}</div>` : ''}
            ${addonsHtml ? `<div style="margin-top:6px; padding-left:10px; border-left:2px solid #e2e8f0">${addonsHtml}</div>` : ''}
          </td>
          <td class="right"><strong>${escapeHtml(formatPeso(lineTotal))}</strong></td>
        </tr>
      `;
    })
    .join('');

  const bodyHtml = `
    <div class="card">
      <div style="text-align:center">
        <h2 style="margin:0">Zwit<span style="color:#2563eb">BlakTea</span></h2>
        <div class="small muted">${escapeHtml(dateText)}</div>
        <div style="margin-top:10px">
          <span class="pill">${escapeHtml(String(transaction.paymentMethod || '—'))}</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Items</div>
      <table>
        <thead>
          <tr><th>Item</th><th class="right">Total</th></tr>
        </thead>
        <tbody>
          ${itemsHtml || ''}
        </tbody>
      </table>
    </div>

    <div class="section card">
      <div class="row"><div class="small muted"><strong>Subtotal</strong></div><div><strong>${escapeHtml(formatPeso(transaction.total))}</strong></div></div>
      ${referenceNumber ? `<div class="row"><div class="small muted"><strong>Reference</strong></div><div><strong>${escapeHtml(referenceNumber)}</strong></div></div>` : ''}
      <div class="row"><div class="small muted"><strong>Cash Received</strong></div><div><strong>${escapeHtml(isCashMethod ? formatPeso(cashReceived) : formatPeso(transaction.total))}</strong></div></div>
      <div class="row"><div class="small muted"><strong>Change</strong></div><div><strong>${escapeHtml(isCashMethod ? formatPeso(changeAmount) : formatPeso(0))}</strong></div></div>
      <div class="row" style="margin-top:8px"><div><strong>Total Paid</strong></div><div><strong>${escapeHtml(formatPeso(transaction.total))}</strong></div></div>
    </div>
  `;

  openPrintPdf({
    title: 'Receipt',
    filename: transaction.id ? `receipt_${transaction.id}` : 'receipt',
    bodyHtml
  });
};
