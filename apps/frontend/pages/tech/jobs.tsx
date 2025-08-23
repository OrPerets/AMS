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
      <h1>Today's Jobs</h1>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            Ticket #{o.ticket.id} - Unit {o.ticket.unitId}{' '}
            <button onClick={() => markDone(o.ticket.id)}>Done</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
