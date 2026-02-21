import { useEffect, useState } from 'react';
import { adminApi } from '../../shared/api';
import type { Group } from '../../shared/types';

export function GroupsPanel() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await adminApi.listGroups();
      setGroups(response.items);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleMute = async (group: Group) => {
    await adminApi.updateGroupState(group._id, { isMuted: !group.isMuted });
    await load();
  };

  const toggleFreeze = async (group: Group) => {
    await adminApi.updateGroupState(group._id, { isFrozen: !group.isFrozen });
    await load();
  };

  return (
    <section className="panel">
      <h3>Group Control</h3>
      {error ? <p className="error">{error}</p> : null}
      <div className="table">
        <div className="tr head">
          <span>Name</span>
          <span>Area</span>
          <span>Privacy</span>
          <span>Members</span>
          <span>Actions</span>
        </div>
        {groups.map((group) => (
          <div className="tr" key={group._id}>
            <span>{group.name}</span>
            <span>{group.area}</span>
            <span>{group.privacy}</span>
            <span>{group.membersCount}</span>
            <span className="actions">
              <button onClick={() => void toggleMute(group)}>{group.isMuted ? 'Unmute' : 'Mute'}</button>
              <button onClick={() => void toggleFreeze(group)}>{group.isFrozen ? 'Unfreeze' : 'Freeze'}</button>
              <button onClick={() => void adminApi.removeGroup(group._id)}>Remove</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

