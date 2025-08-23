import { useEffect, useState } from 'react';

interface Kpis {
  openTickets: number;
  slaBreaches: number;
  unpaidInvoices: number;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<Kpis>({ openTickets: 0, slaBreaches: 0, unpaidInvoices: 0 });
  const [buildingId, setBuildingId] = useState('');

  async function load() {
    const query = buildingId ? `?buildingId=${buildingId}` : '';
    const res = await fetch(`/api/v1/dashboard${query}`);
    if (res.ok) {
      setKpis(await res.json());
    }
  }

  useEffect(() => {
    load();
  }, [buildingId]);

  return (
    <div>
      <h1>דשבורד</h1>
      <input
        placeholder="מזהה בניין"
        value={buildingId}
        onChange={(e) => setBuildingId(e.target.value)}
      />
      <div>קריאות פתוחות: {kpis.openTickets}</div>
      <div>הפרות SLA: {kpis.slaBreaches}</div>
      <div>חשבוניות שלא שולמו: {kpis.unpaidInvoices}</div>
      <a href={`/api/v1/dashboard/export${buildingId ? `?buildingId=${buildingId}` : ''}`}>
        יצוא CSV
      </a>
    </div>
  );
}
