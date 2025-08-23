import { useEffect, useState } from 'react';

interface Ticket {
  id: number;
  unitId: number;
  status: string;
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/tickets')
      .then((res) => res.json())
      .then((data) => {
        setTickets(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>קריאות שירות</h1>
      {loading ? (
        <p>טוען...</p>
      ) : (
        <ul>
          {tickets.map((t) => (
            <li key={t.id}>
              #{t.id} - יחידה {t.unitId} - {t.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
