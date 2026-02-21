import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { webApi } from '../../shared/api';
import type { FeedPost } from '../../shared/types';

const postSchema = z.object({
  userId: z.string().min(8),
  content: z.string().min(3).max(2000),
  category: z.enum(['thought', 'announcement', 'help', 'complaint', 'service', 'lost_found', 'business']),
  locationTag: z.string().max(120).optional(),
  isAnonymous: z.boolean().default(false),
});
type PostForm = z.infer<typeof postSchema>;

export function FeedPanel() {
  const [items, setItems] = useState<FeedPost[]>([]);
  const [status, setStatus] = useState('');
  const { register, handleSubmit, reset } = useForm<PostForm>({
    defaultValues: {
      userId: '9000000002',
      category: 'thought',
      isAnonymous: false,
      locationTag: 'Adirai East',
    },
  });

  const load = async () => {
    const data = await webApi.getFeed('Adirai East');
    setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const onSubmit = async (values: PostForm) => {
    const payload = postSchema.parse(values);
    await webApi.createPost(payload);
    reset({ ...values, content: '' });
    setStatus('Post published');
    await load();
  };

  const doAction = async (postId: string, action: 'like' | 'comment' | 'report') => {
    await webApi.reactPost(postId, action);
    await load();
  };

  const doUrgent = async (postId: string) => {
    const response = await webApi.urgentPost(postId);
    setStatus(`Urgent applied: suggestedTo ${String(response.suggestedTo ?? 0)}`);
    await load();
  };

  const doImportant = async (postId: string) => {
    const response = await webApi.importantPost(postId);
    setStatus(`Important applied: votes ${String(response.importantVotes ?? 0)}`);
    await load();
  };

  return (
    <section className="panel">
      <h3>Community Feed</h3>
      <form className="card" onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="user id" {...register('userId')} />
        <textarea placeholder="Share thoughts / help / complaint..." {...register('content')} />
        <select {...register('category')}>
          <option value="thought">Thought</option>
          <option value="announcement">Announcement</option>
          <option value="help">Help</option>
          <option value="complaint">Complaint</option>
          <option value="service">Service</option>
          <option value="lost_found">Lost & Found</option>
          <option value="business">Business</option>
        </select>
        <input placeholder="location tag" {...register('locationTag')} />
        <label>
          <input type="checkbox" {...register('isAnonymous')} />
          Anonymous posting (for sensitive complaints)
        </label>
        <button type="submit">Post</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}

      <div className="list">
        {items.map((post) => (
          <article className="feed-item" key={post._id}>
            <div className="row">
              <strong>{post.category}</strong>
              <small>{post.locationTag ?? 'Adirai'}</small>
            </div>
            <p>{post.content}</p>
            <div className="meta">
              <span>Score: {post.score ?? 0}</span>
              <span>Likes: {post.likesCount}</span>
              <span>Comments: {post.commentsCount}</span>
              <span>Urgent: {post.urgentVotes}</span>
              <span>Important: {post.importantVotes}</span>
            </div>
            <div className="actions">
              <button onClick={() => void doAction(post._id, 'like')}>Like</button>
              <button onClick={() => void doAction(post._id, 'comment')}>Comment+</button>
              <button onClick={() => void doUrgent(post._id)}>Urgent</button>
              <button onClick={() => void doImportant(post._id)}>Important</button>
              <button onClick={() => void doAction(post._id, 'report')}>Report</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

