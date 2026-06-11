import { useEffect, useState } from "react";
import ErpShell from "../components/ErpShell";
import { purchasingApi } from "../services/purchasingApi";
import { supplierInvoiceApi } from "../services/supplierInvoiceApi";
import { Card, Badge, Tabs } from "../../../components/ui";
import { formatCurrency, formatDateTime } from "../utils/reportFormatters";

export default function ErpPurchasingPage() {
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [exRes, invRes] = await Promise.all([
        purchasingApi.getOutletExpenses().catch(() => null),
        supplierInvoiceApi.list().catch(() => null),
      ]);
      setExpenses(exRes?.data?.data || exRes?.data || []);
      setInvoices(invRes?.data?.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const tabs = [
    { key: "expenses", label: "Outlet Expenses", content: (
      <div className="grid gap-2">
        {expenses.length === 0 ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Belum ada expense</div>
        : expenses.map((e) => (
          <div key={e.id} className="rounded-2xl border border-border bg-surface p-3 flex justify-between items-center">
            <div><p className="font-semibold text-sm">{e.note || "Expense"}</p><p className="text-xs text-muted">{e.branch?.name} • {formatDateTime(e.createdAt)}</p></div>
            <div className="text-right"><p className="font-black">{formatCurrency(e.totalAmount)}</p><Badge tone={e.status === "POSTED" ? "success" : "warning"}>{e.status}</Badge></div>
          </div>
        ))}
      </div>
    )},
    { key: "invoices", label: "Supplier Invoices", content: (
      <div className="grid gap-2">
        {invoices.length === 0 ? <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted">Belum ada invoice</div>
        : invoices.map((i) => (
          <div key={i.id} className="rounded-2xl border border-border bg-surface p-3 flex justify-between items-center">
            <div><p className="font-semibold text-sm">{i.invoiceNumber}</p><p className="text-xs text-muted">{i.supplier?.name}</p></div>
            <div className="text-right"><p className="font-black">{formatCurrency(i.totalAmount)}</p><Badge tone={i.status === "PAID" ? "success" : "warning"}>{i.status}</Badge></div>
          </div>
        ))}
      </div>
    )},
  ];

  return (
    <ErpShell title="Purchasing" description="Pembelian dan tagihan supplier">
      {loading ? <div className="grid gap-2">{[1,2,3].map(i => <div key={i} className="erp-skeleton h-16 w-full rounded-2xl" />)}</div>
      : <Tabs tabs={tabs} defaultTab="expenses" />}
    </ErpShell>
  );
}
