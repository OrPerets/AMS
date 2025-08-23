import React, { useEffect, useState } from 'react';
import { authFetch } from '../../lib/auth';

interface WorkOrder {
  id: number;
  ticket: { id: number; unitId: number };
  costEstimate: number | null;
}

export default function Jobs() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await authFetch('/api/v1/work-orders/today?supplierId=1');
        if (!res.ok) {
          if (isMounted) setOrders([]);
          return;
        }
        const data = await res.json();
        if (isMounted) setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) setOrders([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const markDone = async (ticketId: number) => {
    await authFetch(`/api/v1/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED' }),
    });
    setOrders((o) => o.filter((w) => w.ticket.id !== ticketId));
  };

  return (
    <main>
      <h1>משימות היום</h1>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            קריאה #{o.ticket.id} - יחידה {o.ticket.unitId}{' '}
            <button onClick={() => markDone(o.ticket.id)}>סגור</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
