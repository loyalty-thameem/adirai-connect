import { useMemo, useState } from 'react';
import { BoardPanel } from '../features/home/BoardPanel';
import { ComplaintsPanel } from '../features/home/ComplaintsPanel';
import { ContactsPanel } from '../features/home/ContactsPanel';
import { EventsPanel } from '../features/home/EventsPanel';
import { FeedPanel } from '../features/home/FeedPanel';
import { GroupsPanel } from '../features/home/GroupsPanel';
import { PollsPanel } from '../features/home/PollsPanel';
import { SuggestionsPanel } from '../features/home/SuggestionsPanel';

type TabKey = 'feed' | 'complaints' | 'board' | 'events' | 'contacts' | 'polls' | 'groups' | 'suggestions';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'feed', label: 'Feed' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'board', label: 'Jobs+Biz' },
  { key: 'events', label: 'Events' },
  { key: 'contacts', label: 'Emergency' },
  { key: 'polls', label: 'Polls' },
  { key: 'groups', label: 'Groups' },
  { key: 'suggestions', label: 'Nearby' },
];

export function App() {
  const [tab, setTab] = useState<TabKey>('feed');

  const content = useMemo(() => {
    if (tab === 'complaints') return <ComplaintsPanel />;
    if (tab === 'board') return <BoardPanel />;
    if (tab === 'events') return <EventsPanel />;
    if (tab === 'contacts') return <ContactsPanel />;
    if (tab === 'polls') return <PollsPanel />;
    if (tab === 'groups') return <GroupsPanel />;
    if (tab === 'suggestions') return <SuggestionsPanel />;
    return <FeedPanel />;
  }, [tab]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Adirai Connect</p>
          <h1>Local Feed + Services + Complaints</h1>
        </div>
      </header>
      <nav className="tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={item.key === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <section className="content">{content}</section>
    </main>
  );
}
