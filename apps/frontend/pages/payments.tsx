import { useEffect, useState } from 'react';
import { authFetch } from '../lib/auth';

interface Invoice {
  id: number;
  amount: number;
}

export default function Payments() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await authFetch('/api/v1/invoices/unpaid');
        if (!res.ok) {
          if (isMounted) setInvoices([]);
        } else {
          const data = await res.json();
          if (isMounted) setInvoices(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (isMounted) setInvoices([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
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
