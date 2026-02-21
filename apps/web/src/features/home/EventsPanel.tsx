import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { webApi } from '../../shared/api';
import type { Event } from '../../shared/types';

const schema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(3).max(1500),
  category: z.enum(['marriage', 'religious', 'sports', 'school', 'announcement']),
  eventDate: z.string().min(10),
  area: z.string().min(2).max(100),
  venue: z.string().max(150).optional(),
});
type EventForm = z.infer<typeof schema>;

export function EventsPanel() {
  const [items, setItems] = useState<Event[]>([]);
  const { register, handleSubmit, reset } = useForm<EventForm>({
    defaultValues: { category: 'announcement', area: 'Adirai East' },
  });

  const load = async () => {
    const data = await webApi.getEvents();
    setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: EventForm) => {
    const parsed = schema.parse(values);
    await webApi.createEvent({
      ...parsed,
      eventDate: new Date(parsed.eventDate).toISOString(),
    });
    reset({ ...values, title: '', description: '', venue: '' });
    await load();
  };

  return (
    <section className="panel">
      <h3>Events & Announcements</h3>
      <form className="card" onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="title" {...register('title')} />
        <textarea placeholder="description" {...register('description')} />
        <select {...register('category')}>
          <option value="marriage">Marriage</option>
          <option value="religious">Religious</option>
          <option value="sports">Sports</option>
          <option value="school">School</option>
          <option value="announcement">Announcement</option>
        </select>
        <input type="datetime-local" {...register('eventDate')} />
        <input placeholder="area" {...register('area')} />
        <input placeholder="venue" {...register('venue')} />
        <button type="submit">Create Event</button>
      </form>

      <div className="list">
        {items.map((event) => (
          <article className="feed-item" key={event._id}>
            <div className="row">
              <strong>{event.title}</strong>
              <small>{event.category}</small>
            </div>
            <p>{event.description}</p>
            <div className="meta">
              <span>{new Date(event.eventDate).toLocaleString()}</span>
              <span>{event.area}</span>
              <span>{event.venue ?? '-'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

