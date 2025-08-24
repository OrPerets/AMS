import { useEffect, useState } from 'react';
import { authFetch } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/use-toast';

interface Invoice {
  id: number;
  amount: number;
}

export default function UnpaidInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [residentId, setResidentId] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  async function load() {
    const query = residentId ? `?residentId=${residentId}` : '';
    const res = await authFetch(`/api/v1/invoices/unpaid${query}`);
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
      <div className="my-2 flex gap-2">
        <Button
          onClick={async () => {
            for (const id of Array.from(selected)) {
              await authFetch(`/api/v1/invoices/${id}/confirm`, { method: 'POST' });
            }
            toast({ title: 'עודכן', description: 'החשבוניות סומנו כשולמו' });
            setSelected(new Set());
            load();
          }}
          disabled={selected.size === 0}
        >
          סמן כשולם
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const query = residentId ? `?residentId=${residentId}&format=csv` : '?format=csv';
            window.open(`/api/v1/invoices/unpaid${query}`, '_blank');
          }}
        >
          יצוא CSV
        </Button>
      </div>
      <ul>
        {invoices.map((inv) => (
          <li key={inv.id}>
            <input
              type="checkbox"
              checked={selected.has(inv.id)}
              onChange={(e) => {
                const next = new Set(selected);
                if (e.target.checked) next.add(inv.id); else next.delete(inv.id);
                setSelected(next);
              }}
            />
            <span className="ms-2">#{inv.id} - ₪{inv.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
