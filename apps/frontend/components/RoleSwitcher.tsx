import React, { useEffect, useState } from 'react';
import { getTokenPayload, startImpersonation, stopImpersonation } from '../lib/auth';

const roles = ['ADMIN', 'PM', 'TECH', 'RESIDENT', 'ACCOUNTANT'];

export default function RoleSwitcher() {
  const [payload, setPayload] = useState<any | null>(null);
  const [role, setRole] = useState('ADMIN');
  const [tenantId, setTenantId] = useState(1);

  useEffect(() => {
    setPayload(getTokenPayload());
  }, []);

  async function handleImpersonate() {
    await startImpersonation(role, tenantId);
    setPayload(getTokenPayload());
  }

  async function handleStop() {
    await stopImpersonation();
    setPayload(getTokenPayload());
  }

  if (!payload || payload.role !== 'MASTER') return null;

  if (payload.actAsRole) {
    return (
      <div style={{ background: '#fffae6', padding: 8, marginBottom: 8 }}>
        צפייה כ–{payload.actAsRole}{' '}
        <button onClick={handleStop}>חזור למשתמש המקורי</button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={tenantId}
        onChange={(e) => setTenantId(parseInt(e.target.value, 10))}
        style={{ width: 60, marginLeft: 8 }}
      />
      <button onClick={handleImpersonate} style={{ marginLeft: 8 }}>
        החלף תפקיד
      </button>
    </div>
  );
}
