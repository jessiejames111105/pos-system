import React from 'react';
import { Receipt } from 'lucide-react';
import { openPrintReceipt } from '../lib/printReceipt';

const formatPeso = (n) =>
  `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const ReceiptPanel = ({ transaction, showPrint = true, onClose, onPrint }) => {
  if (!transaction) return null;
  const paymentText = String(transaction.paymentMethod || '');
  const isCashMethod =
    paymentText.toLowerCase().includes('cash') ||
    transaction.cashReceived != null ||
    transaction.changeAmount != null;
  const referenceNumber = transaction.referenceNumber ?? transaction.reference_number ?? null;
  
  const paymentLabel = paymentText ? String(paymentText).toUpperCase() : '—';
  const cashReceived = transaction.cashReceived == null && isCashMethod ? Number(transaction.total || 0) : transaction.cashReceived;
  const changeAmount =
    transaction.changeAmount == null && isCashMethod
      ? Math.max(0, Number(cashReceived || 0) - Number(transaction.total || 0))
      : transaction.changeAmount;
  const paidAmount = isCashMethod ? cashReceived : Number(transaction.total || 0);
  const displayChange = isCashMethod ? changeAmount : 0;
  const transId = String(transaction.id ?? '').trim();
  const date = transaction.date ? new Date(transaction.date) : new Date();
  const dateText = Number.isNaN(date.getTime()) ? '' : date.toLocaleString();

  return (
    <div className="relative bg-white w-full max-w-sm max-h-[92vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
      <div className="p-8 bg-emerald-50 text-center border-b border-emerald-100">
        <p className="text-emerald-700 font-bold uppercase tracking-wide text-[10px]">Transaction Completed</p>
      </div>

      <div className="p-10 flex-1 overflow-y-auto space-y-8">
        <div className="text-center space-y-1">
          <p className="text-xl font-bold text-slate-900 tracking-tight">
            Zwit<span className="text-primary-600">BlakTea</span>
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-dashed border-slate-200 pb-2">
            <span>Item</span>
            <span>Total</span>
          </div>
          <div className="space-y-4">
            {(transaction.items || []).map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800 uppercase leading-tight">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {Number(item.quantity || 0)}X @ {formatPeso(item.price)}
                    </p>
                    {item.details ? (
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{String(item.details).toUpperCase()}</p>
                    ) : null}
                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-1 pl-2 border-l border-slate-200">
                        {item.addons
                          .filter(a => Number(a.quantity || 0) > 0)
                          .map((addon, ai) => (
                            <p key={ai} className="text-[8px] text-primary-600 font-bold uppercase tracking-wide">
                              + {addon.name} x{Number(addon.quantity || 0)} ({formatPeso(addon.price)})
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {formatPeso(Number(item.price || 0) * Number(item.quantity || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t-2 border-dashed border-slate-100 space-y-3">
          <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
            <span>Subtotal</span>
            <span className="text-slate-900 font-bold">{formatPeso(transaction.total)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
            <span>Payment Method</span>
            <span className="text-slate-900 font-bold">{paymentLabel}</span>
          </div>
          {referenceNumber ? (
            <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
              <span>Reference Number</span>
              <span className="text-slate-900 font-bold">{String(referenceNumber)}</span>
            </div>
          ) : null}
          <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
            <span>Cash Received</span>
            <span className="text-slate-900 font-bold">{paidAmount == null ? '—' : formatPeso(paidAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase">
            <span>Change</span>
            <span className="text-emerald-600 font-bold">{displayChange == null ? '—' : formatPeso(displayChange)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">
              Total Paid ({String(transaction.paymentMethod || '').toUpperCase()})
            </span>
            <span className="text-2xl font-bold text-primary-600 tracking-tight">{formatPeso(transaction.total)}</span>
          </div>
        </div>

        <div className="text-center space-y-2 pt-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Thank you for your order!</p>
          <p className="text-[8px] text-slate-300 font-medium">
            {transId ? `Trans ID: ${transId} | ` : ''}{dateText}
          </p>
        </div>
      </div>

      <div className="p-10 pt-0 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-5 bg-slate-900 text-white font-bold rounded-3xl uppercase tracking-wide text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Done
        </button>
        {showPrint ? (
          <button
            onClick={onPrint || (() => openPrintReceipt({ transaction }))}
            className="p-5 bg-slate-100 text-slate-400 rounded-3xl hover:bg-slate-200 transition-all"
          >
            <Receipt size={24} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default ReceiptPanel;
