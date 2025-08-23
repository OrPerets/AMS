import React, { useEffect, useState } from 'react';

interface WorkOrder {
  id: number;
  ticket: { id: number; unitId: number };
  costEstimate: number | null;
}

export default function Jobs() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);

  useEffect(() => {
    fetch('/api/v1/work-orders/today?supplierId=1')
      .then((res) => res.json())
      .then(setOrders);
  }, []);

  const markDone = async (ticketId: number) => {
    await fetch(`/api/v1/tickets/${ticketId}/status`, {
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
