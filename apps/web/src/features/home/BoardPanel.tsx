import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { webApi } from '../../shared/api';
import type { Listing } from '../../shared/types';

const schema = z.object({
  userId: z.string().min(8),
  type: z.enum(['job', 'business', 'offer', 'freelancer', 'rental', 'vehicle']),
  title: z.string().min(3).max(150),
  description: z.string().min(3).max(1500),
  area: z.string().min(2).max(100),
  contactName: z.string().max(120).optional(),
  contactPhone: z.string().max(20).optional(),
  priceLabel: z.string().max(80).optional(),
});
type FormData = z.infer<typeof schema>;

export function BoardPanel() {
  const [items, setItems] = useState<Listing[]>([]);
  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: { userId: '9000000002', type: 'job', area: 'Adirai East' },
  });

  const load = async () => {
    const data = await webApi.getListings();
    setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: FormData) => {
    await webApi.createListing(schema.parse(values));
    reset({ ...values, title: '', description: '', priceLabel: '' });
    await load();
  };

  return (
    <section className="panel">
      <h3>Job & Business Board</h3>
      <form className="card" onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="user id" {...register('userId')} />
        <select {...register('type')}>
          <option value="job">Job</option>
          <option value="business">Business</option>
          <option value="offer">Offer</option>
          <option value="freelancer">Freelancer</option>
          <option value="rental">Rental</option>
          <option value="vehicle">Vehicle</option>
        </select>
        <input placeholder="title" {...register('title')} />
        <textarea placeholder="description" {...register('description')} />
        <input placeholder="area" {...register('area')} />
        <input placeholder="contact name" {...register('contactName')} />
        <input placeholder="contact phone" {...register('contactPhone')} />
        <input placeholder="price or salary label" {...register('priceLabel')} />
        <button type="submit">Post Listing</button>
      </form>

      <div className="list">
        {items.map((item) => (
          <article className="feed-item" key={item._id}>
            <div className="row">
              <strong>{item.title}</strong>
              <small>{item.type}</small>
            </div>
            <p>{item.description}</p>
            <div className="meta">
              <span>{item.area}</span>
              <span>{item.contactPhone ?? '-'}</span>
              <span>{item.priceLabel ?? '-'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

