import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '../../shared/api';
import type { AdminUser } from '../../shared/types';

const filterSchema = z.object({
  q: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  area: z.string().optional(),
});

type FilterForm = z.infer<typeof filterSchema>;

export function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [insights, setInsights] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const { register, handleSubmit } = useForm<FilterForm>();

  const loadUsers = async (query = '') => {
    try {
      const response = await adminApi.listUsers(query);
      setUsers(response.items);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const onFilter = async (values: FilterForm) => {
    const parsed = filterSchema.parse(values);
    const params = new URLSearchParams();
    Object.entries(parsed).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    await loadUsers(params.toString());
  };

  const openInsights = async (user: AdminUser) => {
    setSelectedUser(user);
    try {
      const data = await adminApi.getUserInsights(user._id);
      setInsights(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const applyStatus = async (userId: string, status: 'active' | 'blocked' | 'suspended' | 'deleted') => {
    await adminApi.updateUserStatus(userId, { status });
    await loadUsers();
  };

  return (
    <section className="panel">
      <h3>User Management</h3>
      <form className="toolbar" onSubmit={handleSubmit(onFilter)}>
        <input placeholder="search name/mobile/email" {...register('q')} />
        <input placeholder="area" {...register('area')} />
        <select {...register('role')}>
          <option value="">all roles</option>
          <option value="user">user</option>
          <option value="business_user">business_user</option>
          <option value="moderator">moderator</option>
          <option value="admin">admin</option>
          <option value="super_admin">super_admin</option>
        </select>
        <select {...register('status')}>
          <option value="">all status</option>
          <option value="active">active</option>
          <option value="blocked">blocked</option>
          <option value="suspended">suspended</option>
          <option value="deleted">deleted</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      {error ? <p className="error">{error}</p> : null}

      <div className="table">
        <div className="tr head">
          <span>Name</span>
          <span>Role</span>
          <span>Status</span>
          <span>Area</span>
          <span>Actions</span>
        </div>
        {users.map((user) => (
          <div className="tr" key={user._id}>
            <span>{user.name}</span>
            <span>{user.role}</span>
            <span>{user.status}</span>
            <span>{user.area}</span>
            <span className="actions">
              <button onClick={() => void openInsights(user)}>Insights</button>
              <button onClick={() => void applyStatus(user._id, 'blocked')}>Block</button>
              <button onClick={() => void applyStatus(user._id, 'suspended')}>Suspend</button>
              <button onClick={() => void adminApi.forceLogoutUser(user._id)}>Force logout</button>
              <button onClick={() => void adminApi.verifyUser(user._id, !user.verifiedBadge)}>
                {user.verifiedBadge ? 'Unverify' : 'Verify'}
              </button>
              <button onClick={() => void adminApi.softDeleteUser(user._id)}>Delete</button>
            </span>
          </div>
        ))}
      </div>

      {selectedUser && insights ? (
        <article className="detail-card">
          <h4>User Intelligence: {selectedUser.name}</h4>
          <pre>{JSON.stringify(insights, null, 2)}</pre>
        </article>
      ) : null}
    </section>
  );
}

