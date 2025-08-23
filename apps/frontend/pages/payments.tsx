import { useEffect, useState } from 'react';

interface Invoice {
  id: number;
  amount: number;
}

export default function Payments() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/invoices/unpaid')
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>תשלומים פתוחים</h1>
      {loading ? (
        <p>טוען...</p>
      ) : (
        <ul>
          {invoices.map((inv) => (
            <li key={inv.id}>
              #{inv.id} - ₪{inv.amount}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
