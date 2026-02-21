import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { webApi } from '../../shared/api';
import type { Group } from '../../shared/types';

const schema = z.object({
  userId: z.string().min(8),
  name: z.string().min(3).max(120),
  area: z.string().min(2).max(100),
  privacy: z.enum(['public', 'private', 'invite_only']),
});
type GroupForm = z.infer<typeof schema>;

export function GroupsPanel() {
  const [items, setItems] = useState<Group[]>([]);
  const [status, setStatus] = useState('');
  const { register, handleSubmit, reset } = useForm<GroupForm>({
    defaultValues: { userId: '9000000002', area: 'Adirai East', privacy: 'public' },
  });

  const load = async () => {
    const data = await webApi.getGroups();
    setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: GroupForm) => {
    try {
      await webApi.createGroup(schema.parse(values));
      setStatus('Group created');
      reset({ ...values, name: '' });
      await load();
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <section className="panel">
      <h3>Groups (max 3 created by user)</h3>
      <form className="card" onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="user id" {...register('userId')} />
        <input placeholder="group name" {...register('name')} />
        <input placeholder="area" {...register('area')} />
        <select {...register('privacy')}>
          <option value="public">public</option>
          <option value="private">private</option>
          <option value="invite_only">invite only</option>
        </select>
        <button type="submit">Create Group</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}

      <div className="list">
        {items.map((group) => (
          <article className="feed-item" key={group._id}>
            <div className="row">
              <strong>{group.name}</strong>
              <small>{group.privacy}</small>
            </div>
            <div className="meta">
              <span>{group.area}</span>
              <span>Members: {group.membersCount}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

