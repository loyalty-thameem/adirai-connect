import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { webApi } from '../../shared/api';
import type { Poll } from '../../shared/types';

const createSchema = z.object({
  question: z.string().min(3).max(300),
  option1: z.string().min(1).max(120),
  option2: z.string().min(1).max(120),
  option3: z.string().max(120).optional(),
  area: z.string().min(2).max(100),
  endsAt: z.string().min(10),
});
type CreateForm = z.infer<typeof createSchema>;

const voteSchema = z.object({
  pollId: z.string().min(8),
  userId: z.string().min(8),
  optionId: z.string().min(1),
});
type VoteForm = z.infer<typeof voteSchema>;

export function PollsPanel() {
  const [items, setItems] = useState<Poll[]>([]);
  const [status, setStatus] = useState('');
  const createForm = useForm<CreateForm>({
    defaultValues: { area: 'Adirai East' },
  });
  const voteForm = useForm<VoteForm>({
    defaultValues: { userId: '9000000002' },
  });

  const load = async () => {
    const data = await webApi.getPolls();
    setItems(data.items);
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (values: CreateForm) => {
    const parsed = createSchema.parse(values);
    const options = [parsed.option1, parsed.option2, parsed.option3].filter(Boolean);
    await webApi.createPoll({
      question: parsed.question,
      options,
      area: parsed.area,
      endsAt: new Date(parsed.endsAt).toISOString(),
    });
    createForm.reset({ ...values, question: '', option1: '', option2: '', option3: '' });
    await load();
  };

  const onVote = async (values: VoteForm) => {
    await webApi.votePoll(voteSchema.parse(values));
    setStatus('Vote submitted');
    await load();
  };

  return (
    <section className="panel">
      <h3>Polls & Voting</h3>
      <form className="card" onSubmit={createForm.handleSubmit(onCreate)}>
        <input placeholder="question" {...createForm.register('question')} />
        <input placeholder="option 1" {...createForm.register('option1')} />
        <input placeholder="option 2" {...createForm.register('option2')} />
        <input placeholder="option 3 (optional)" {...createForm.register('option3')} />
        <input placeholder="area" {...createForm.register('area')} />
        <input type="datetime-local" {...createForm.register('endsAt')} />
        <button type="submit">Create Poll</button>
      </form>

      <form className="card" onSubmit={voteForm.handleSubmit(onVote)}>
        <h4>Vote</h4>
        <input placeholder="poll id" {...voteForm.register('pollId')} />
        <input placeholder="user id" {...voteForm.register('userId')} />
        <input placeholder="option id (opt_1)" {...voteForm.register('optionId')} />
        <button type="submit">Submit Vote</button>
      </form>

      {status ? <p className="hint">{status}</p> : null}

      <div className="list">
        {items.map((poll) => (
          <article className="feed-item" key={poll._id}>
            <div className="row">
              <strong>{poll.question}</strong>
              <small>{new Date(poll.endsAt).toLocaleDateString()}</small>
            </div>
            <ul className="options">
              {poll.options.map((option) => (
                <li key={option.id}>
                  {option.id}: {option.label} ({option.votes})
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

