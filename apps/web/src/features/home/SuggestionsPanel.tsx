import { useEffect, useState } from 'react';
import { webApi } from '../../shared/api';
import type { Suggestions } from '../../shared/types';

export function SuggestionsPanel() {
  const [data, setData] = useState<Suggestions | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await webApi.getSuggestions('Adirai East');
      setData(response);
    };
    void load();
  }, []);

  if (!data) {
    return (
      <section className="panel">
        <h3>Suggestions</h3>
        <p className="hint">Loading...</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h3>Nearby & Top Suggestions</h3>
      <div className="grid-two">
        <article className="card">
          <h4>Nearby Users</h4>
          <ul className="options">
            {data.nearbyUsers.slice(0, 10).map((user) => (
              <li key={user._id}>{user.name} - {user.area}</li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h4>Suggested Groups</h4>
          <ul className="options">
            {data.suggestedGroups.slice(0, 10).map((group) => (
              <li key={group._id}>{group.name} ({group.membersCount})</li>
            ))}
          </ul>
        </article>
      </div>
      <article className="card">
        <h4>Suggested Businesses</h4>
        <ul className="options">
          {data.suggestedBusinesses.slice(0, 10).map((business) => (
            <li key={business._id}>{business.title} - {business.area}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

