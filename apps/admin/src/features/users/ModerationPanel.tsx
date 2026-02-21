import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '../../shared/api';
import type { ModerationFlag } from '../../shared/types';

const createFlagSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user']),
  targetId: z.string().min(1),
  reason: z.string().min(3),
  severity: z.enum(['low', 'medium', 'high']),
});
type CreateFlagForm = z.infer<typeof createFlagSchema>;

const settingsSchema = z.object({
  aiToxicityEnabled: z.boolean(),
  fakeNewsDetectionEnabled: z.boolean(),
  autoModerationEnabled: z.boolean(),
  shadowBanEnabled: z.boolean(),
  keyword: z.string().optional(),
});
type SettingsForm = z.infer<typeof settingsSchema>;

export function ModerationPanel() {
  const [flags, setFlags] = useState<ModerationFlag[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset } = useForm<CreateFlagForm>({
    defaultValues: { targetType: 'post', severity: 'medium' },
  });
  const settingsForm = useForm<SettingsForm>({
    defaultValues: {
      aiToxicityEnabled: true,
      fakeNewsDetectionEnabled: true,
      autoModerationEnabled: true,
      shadowBanEnabled: true,
      keyword: '',
    },
  });

  const load = async () => {
    try {
      const [flagsResponse, settingsResponse] = await Promise.all([
        adminApi.listModerationFlags(),
        adminApi.getModerationSettings(),
      ]);
      setFlags(flagsResponse.items);
      setSettings(settingsResponse);
      settingsForm.reset({
        aiToxicityEnabled: Boolean(settingsResponse.aiToxicityEnabled),
        fakeNewsDetectionEnabled: Boolean(settingsResponse.fakeNewsDetectionEnabled),
        autoModerationEnabled: Boolean(settingsResponse.autoModerationEnabled),
        shadowBanEnabled: Boolean(settingsResponse.shadowBanEnabled),
      });
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreateFlag = async (values: CreateFlagForm) => {
    const payload = createFlagSchema.parse(values);
    await adminApi.createModerationFlag(payload);
    reset({ targetType: 'post', severity: 'medium', targetId: '', reason: '' });
    await load();
  };

  const onSettings = async (values: SettingsForm) => {
    const payload = settingsSchema.parse(values);
    await adminApi.updateModerationSettings(payload);
    if (payload.keyword) {
      await adminApi.addKeyword(payload.keyword);
    }
    await load();
  };

  return (
    <section className="panel">
      <h3>Content Control</h3>
      {error ? <p className="error">{error}</p> : null}

      <form className="card" onSubmit={handleSubmit(onCreateFlag)}>
        <h4>Create Moderation Flag</h4>
        <select {...register('targetType')}>
          <option value="post">post</option>
          <option value="comment">comment</option>
          <option value="user">user</option>
        </select>
        <input placeholder="target id" {...register('targetId')} />
        <input placeholder="reason" {...register('reason')} />
        <select {...register('severity')}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
        <button type="submit">Create Flag</button>
      </form>

      <form className="card" onSubmit={settingsForm.handleSubmit(onSettings)}>
        <h4>Moderation Settings</h4>
        <label>
          <input type="checkbox" {...settingsForm.register('aiToxicityEnabled')} />
          AI toxicity detection
        </label>
        <label>
          <input type="checkbox" {...settingsForm.register('fakeNewsDetectionEnabled')} />
          Fake news detection
        </label>
        <label>
          <input type="checkbox" {...settingsForm.register('autoModerationEnabled')} />
          Auto moderation
        </label>
        <label>
          <input type="checkbox" {...settingsForm.register('shadowBanEnabled')} />
          Shadow ban enabled
        </label>
        <input placeholder="add blacklist keyword" {...settingsForm.register('keyword')} />
        <button type="submit">Save Settings</button>
      </form>

      <div className="table">
        <div className="tr head">
          <span>Target</span>
          <span>Reason</span>
          <span>Severity</span>
          <span>Resolved</span>
          <span>Action</span>
        </div>
        {flags.map((flag) => (
          <div className="tr" key={flag._id}>
            <span>{flag.targetType}:{flag.targetId}</span>
            <span>{flag.reason}</span>
            <span>{flag.severity}</span>
            <span>{String(flag.resolved)}</span>
            <span>
              {!flag.resolved ? (
                <button onClick={() => void adminApi.resolveModerationFlag(flag._id, { resolved: true })}>
                  Resolve
                </button>
              ) : (
                'done'
              )}
            </span>
          </div>
        ))}
      </div>

      {settings ? (
        <article className="detail-card">
          <h4>Current Settings</h4>
          <pre>{JSON.stringify(settings, null, 2)}</pre>
        </article>
      ) : null}
    </section>
  );
}

