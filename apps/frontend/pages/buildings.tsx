import { useEffect, useState } from 'react';
import { authFetch } from '../lib/auth';

interface Building {
  id: number;
  name: string;
}

export default function Buildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/v1/buildings');
        if (!res.ok) {
          throw new Error(`Failed to load buildings (${res.status})`);
        }
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
          ? (data as any).items
          : [];
        setBuildings(list);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
        setBuildings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h1>בניינים</h1>
      {loading ? (
        <p>טוען...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <ul>
          {buildings.map((b) => (
            <li key={b.id}>{b.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
