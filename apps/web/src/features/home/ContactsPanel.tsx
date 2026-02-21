import { useEffect, useState } from 'react';
import { webApi } from '../../shared/api';
import type { Contact } from '../../shared/types';

export function ContactsPanel() {
  const [items, setItems] = useState<Contact[]>([]);
  const [status, setStatus] = useState('');

  const load = async () => {
    const data = await webApi.getContacts();
    setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const seed = async () => {
    await webApi.seedContacts();
    setStatus('Default contacts seeded');
    await load();
  };

  return (
    <section className="panel">
      <h3>Emergency & Important Contacts</h3>
      <button onClick={() => void seed()}>Seed Contacts</button>
      {status ? <p className="hint">{status}</p> : null}
      <div className="list">
        {items.map((contact) => (
          <article className="feed-item" key={contact._id}>
            <div className="row">
              <strong>{contact.name}</strong>
              <small>{contact.type}</small>
            </div>
            <div className="meta">
              <span>{contact.phone}</span>
              <span>{contact.area}</span>
              <span>{contact.available24x7 ? '24x7' : 'Scheduled'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

