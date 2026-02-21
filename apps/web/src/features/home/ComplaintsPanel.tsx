import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { webApi } from '../../shared/api';
import type { Complaint } from '../../shared/types';

const schema = z.object({
  userId: z.string().min(8),
  title: z.string().min(3).max(150),
  description: z.string().min(3).max(2000),
  category: z.enum(['water', 'road', 'electricity', 'garbage', 'drainage', 'other']),
  area: z.string().min(2).max(100),
});
type ComplaintForm = z.infer<typeof schema>;

export function ComplaintsPanel() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [status, setStatus] = useState('');
  const { register, handleSubmit, reset } = useForm<ComplaintForm>({
    defaultValues: { userId: '9000000002', category: 'water', area: 'Adirai East' },
  });

  const load = async () => {
    const data = await webApi.getMyComplaints('9000000002');
    setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: ComplaintForm) => {
    await webApi.createComplaint(schema.parse(values));
    reset({ ...values, title: '', description: '' });
    setStatus('Complaint submitted');
    await load();
  };

  return (
    <section className="panel">
      <h3>Complaint & Request</h3>
      <form className="card" onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="user id" {...register('userId')} />
        <input placeholder="title" {...register('title')} />
        <textarea placeholder="describe issue..." {...register('description')} />
        <select {...register('category')}>
          <option value="water">Water</option>
          <option value="road">Road</option>
          <option value="electricity">EB</option>
          <option value="garbage">Garbage</option>
          <option value="drainage">Drainage</option>
          <option value="other">Other</option>
        </select>
        <input placeholder="area" {...register('area')} />
        <button type="submit">Submit Complaint</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}

      <div className="list">
        {items.map((item) => (
          <article className="feed-item" key={item._id}>
            <div className="row">
              <strong>{item.title}</strong>
              <small>{item.status}</small>
            </div>
            <p>{item.description}</p>
            <div className="meta">
              <span>{item.category}</span>
              <span>{item.area}</span>
              <span>{new Date(item.createdAt).toLocaleString()}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

