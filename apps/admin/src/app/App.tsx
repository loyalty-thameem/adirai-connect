import { useMemo, useState } from 'react';
import { ComplaintsPanel } from '../features/users/ComplaintsPanel';
import { DashboardPanel } from '../features/users/DashboardPanel';
import { GroupsPanel } from '../features/users/GroupsPanel';
import { MobileConfigPanel } from '../features/users/MobileConfigPanel';
import { MessagingPanel } from '../features/users/MessagingPanel';
import { ModerationPanel } from '../features/users/ModerationPanel';
import { UsersPanel } from '../features/users/UsersPanel';

type TabKey = 'dashboard' | 'users' | 'complaints' | 'moderation' | 'messaging' | 'groups' | 'mobile';

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'groups', label: 'Groups' },
  { key: 'mobile', label: 'Mobile Config' },
];

export function App() {
  const [tab, setTab] = useState<TabKey>('dashboard');

  const content = useMemo(() => {
    if (tab === 'users') return <UsersPanel />;
    if (tab === 'complaints') return <ComplaintsPanel />;
    if (tab === 'moderation') return <ModerationPanel />;
    if (tab === 'messaging') return <MessagingPanel />;
    if (tab === 'groups') return <GroupsPanel />;
    if (tab === 'mobile') return <MobileConfigPanel />;
    return <DashboardPanel />;
  }, [tab]);

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <h1>Adirai Admin</h1>
        <p>Command Center</p>
        <nav>
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
      </aside>
      <section className="content">{content}</section>
    </main>
  );
}
