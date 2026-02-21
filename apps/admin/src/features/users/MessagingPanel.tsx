import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '../../shared/api';
import type { Campaign } from '../../shared/types';

const personalSchema = z.object({
  userId: z.string().min(8),
  title: z.string().min(3),
  body: z.string().min(3),
  channels: z.array(z.enum(['in_app', 'email', 'whatsapp'])).min(1),
});
type PersonalForm = z.infer<typeof personalSchema>;

const broadcastSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(3),
  area: z.string().optional(),
  role: z.string().optional(),
  activeOnly: z.boolean(),
  verifiedOnly: z.boolean(),
  channels: z.array(z.enum(['in_app', 'email', 'whatsapp'])).min(1),
});
type BroadcastForm = z.infer<typeof broadcastSchema>;

export function MessagingPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState('');
  const personalForm = useForm<PersonalForm>({
    defaultValues: { channels: ['in_app'] },
  });
  const broadcastForm = useForm<BroadcastForm>({
    defaultValues: { channels: ['in_app'], activeOnly: true, verifiedOnly: false },
  });

  const load = async () => {
    try {
      const response = await adminApi.listCampaigns();
      setCampaigns(response.items);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onPersonal = async (values: PersonalForm) => {
    const payload = personalSchema.parse(values);
    await adminApi.sendPersonalMessage(payload);
    personalForm.reset({ channels: ['in_app'] });
    await load();
  };

  const onBroadcast = async (values: BroadcastForm) => {
    const payload = broadcastSchema.parse(values);
    await adminApi.sendBroadcastMessage(payload);
    broadcastForm.reset({ channels: ['in_app'], activeOnly: true, verifiedOnly: false });
    await load();
  };

  return (
    <section className="panel">
      <h3>Admin Communication System</h3>
      {error ? <p className="error">{error}</p> : null}

      <div className="grid-two">
        <form className="card" onSubmit={personalForm.handleSubmit(onPersonal)}>
          <h4>Personal Message</h4>
          <input placeholder="user id" {...personalForm.register('userId')} />
          <input placeholder="title" {...personalForm.register('title')} />
          <textarea placeholder="message" {...personalForm.register('body')} />
          <label><input type="checkbox" value="in_app" {...personalForm.register('channels')} /> In-app</label>
          <label><input type="checkbox" value="email" {...personalForm.register('channels')} /> Email</label>
          <label><input type="checkbox" value="whatsapp" {...personalForm.register('channels')} /> WhatsApp</label>
          <button type="submit">Send Personal</button>
        </form>

        <form className="card" onSubmit={broadcastForm.handleSubmit(onBroadcast)}>
          <h4>Broadcast</h4>
          <input placeholder="title" {...broadcastForm.register('title')} />
          <textarea placeholder="message" {...broadcastForm.register('body')} />
          <input placeholder="area (optional)" {...broadcastForm.register('area')} />
          <input placeholder="role (optional)" {...broadcastForm.register('role')} />
          <label><input type="checkbox" {...broadcastForm.register('activeOnly')} /> Active users only</label>
          <label><input type="checkbox" {...broadcastForm.register('verifiedOnly')} /> Verified users only</label>
          <label><input type="checkbox" value="in_app" {...broadcastForm.register('channels')} /> In-app</label>
          <label><input type="checkbox" value="email" {...broadcastForm.register('channels')} /> Email</label>
          <label><input type="checkbox" value="whatsapp" {...broadcastForm.register('channels')} /> WhatsApp</label>
          <button type="submit">Send Broadcast</button>
        </form>
      </div>

      <div className="table">
        <div className="tr head">
          <span>Mode</span>
          <span>Title</span>
          <span>Status</span>
          <span>Targets</span>
          <span>Created</span>
        </div>
        {campaigns.map((campaign) => (
          <div className="tr" key={campaign._id}>
            <span>{campaign.mode}</span>
            <span>{campaign.title}</span>
            <span>{campaign.status}</span>
            <span>{campaign.deliveryStats?.totalTargets ?? 0}</span>
            <span>{new Date(campaign.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

