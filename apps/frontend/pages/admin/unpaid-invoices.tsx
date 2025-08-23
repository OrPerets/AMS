import { useEffect, useState } from 'react';

interface Invoice {
  id: number;
  amount: number;
}

export default function UnpaidInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [residentId, setResidentId] = useState('');

  async function load() {
    const query = residentId ? `?residentId=${residentId}` : '';
    const res = await fetch(`/api/v1/invoices/unpaid${query}`);
    if (res.ok) {
      setInvoices(await res.json());
    }
  }

  useEffect(() => {
    load();
  }, [residentId]);

  return (
    <div>
      <h1>חשבוניות שלא שולמו</h1>
      <input
        placeholder="מזהה דייר"
        value={residentId}
        onChange={(e) => setResidentId(e.target.value)}
      />
      <ul>
        {invoices.map((inv) => (
          <li key={inv.id}>
            #{inv.id} - ₪{inv.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}
