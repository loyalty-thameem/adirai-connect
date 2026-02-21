import { useEffect, useState } from 'react';
import { adminApi } from '../../shared/api';

export function DashboardPanel() {
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [security, setSecurity] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [a, s] = await Promise.all([adminApi.getAnalytics(), adminApi.getSecurity()]);
        setAnalytics(a);
        setSecurity(s);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    void load();
  }, []);

  return (
    <section className="panel">
      <h3>Analytics + Security Dashboard</h3>
      {error ? <p className="error">{error}</p> : null}
      <div className="stats">
        <article>
          <h4>Analytics</h4>
          <pre>{JSON.stringify(analytics, null, 2)}</pre>
        </article>
        <article>
          <h4>Security</h4>
          <pre>{JSON.stringify(security, null, 2)}</pre>
        </article>
      </div>
    </section>
  );
}

