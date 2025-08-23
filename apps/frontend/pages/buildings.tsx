import { useEffect, useState } from 'react';

interface Building {
  id: number;
  name: string;
}

export default function Buildings() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/buildings')
      .then((res) => res.json())
      .then((data) => {
        setBuildings(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>בניינים</h1>
      {loading ? (
        <p>טוען...</p>
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
