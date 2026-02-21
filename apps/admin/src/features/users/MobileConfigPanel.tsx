import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { adminApi } from '../../shared/api';
import type { MobileConfig } from '../../shared/types';

const schema = z.object({
  minAndroidVersion: z.string().min(1),
  minIosVersion: z.string().min(1),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().max(300).optional(),
  forceUpdate: z.boolean(),
  pushEnabled: z.boolean(),
  apiTimeoutMs: z.coerce.number().int().min(1000).max(60000),
  releaseChannel: z.string().min(1).max(40),
  chatEnabled: z.boolean(),
  marketplaceEnabled: z.boolean(),
  pollsEnabled: z.boolean(),
  groupsEnabled: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function MobileConfigPanel() {
  const [saved, setSaved] = useState<MobileConfig | null>(null);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      minAndroidVersion: '1.0.0',
      minIosVersion: '1.0.0',
      maintenanceMode: false,
      maintenanceMessage: '',
      forceUpdate: false,
      pushEnabled: true,
      apiTimeoutMs: 12000,
      releaseChannel: 'production',
      chatEnabled: true,
      marketplaceEnabled: false,
      pollsEnabled: true,
      groupsEnabled: true,
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const config = await adminApi.getMobileConfig();
        reset({
          minAndroidVersion: config.minAndroidVersion,
          minIosVersion: config.minIosVersion,
          maintenanceMode: config.maintenanceMode,
          maintenanceMessage: config.maintenanceMessage ?? '',
          forceUpdate: config.forceUpdate,
          pushEnabled: config.pushEnabled,
          apiTimeoutMs: config.apiTimeoutMs,
          releaseChannel: config.releaseChannel,
          chatEnabled: Boolean(config.featureFlags?.chatEnabled),
          marketplaceEnabled: Boolean(config.featureFlags?.marketplaceEnabled),
          pollsEnabled: Boolean(config.featureFlags?.pollsEnabled),
          groupsEnabled: Boolean(config.featureFlags?.groupsEnabled),
        });
        setSaved(config);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    void load();
  }, [reset]);

  const onSubmit = async (values: FormData) => {
    try {
      const parsed = schema.parse(values);
      const updated = await adminApi.updateMobileConfig({
        minAndroidVersion: parsed.minAndroidVersion,
        minIosVersion: parsed.minIosVersion,
        maintenanceMode: parsed.maintenanceMode,
        maintenanceMessage: parsed.maintenanceMessage,
        forceUpdate: parsed.forceUpdate,
        pushEnabled: parsed.pushEnabled,
        apiTimeoutMs: parsed.apiTimeoutMs,
        releaseChannel: parsed.releaseChannel,
        featureFlags: {
          chatEnabled: parsed.chatEnabled,
          marketplaceEnabled: parsed.marketplaceEnabled,
          pollsEnabled: parsed.pollsEnabled,
          groupsEnabled: parsed.groupsEnabled,
        },
      });
      setSaved(updated);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section className="panel">
      <h3>Mobile Configuration</h3>
      <form className="card" onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="min android version" {...register('minAndroidVersion')} />
        <input placeholder="min iOS version" {...register('minIosVersion')} />
        <input placeholder="release channel" {...register('releaseChannel')} />
        <input type="number" placeholder="api timeout ms" {...register('apiTimeoutMs')} />
        <label><input type="checkbox" {...register('maintenanceMode')} /> Maintenance mode</label>
        <textarea placeholder="maintenance message" {...register('maintenanceMessage')} />
        <label><input type="checkbox" {...register('forceUpdate')} /> Force update</label>
        <label><input type="checkbox" {...register('pushEnabled')} /> Push enabled</label>
        <label><input type="checkbox" {...register('chatEnabled')} /> Chat feature</label>
        <label><input type="checkbox" {...register('marketplaceEnabled')} /> Marketplace feature</label>
        <label><input type="checkbox" {...register('pollsEnabled')} /> Polls feature</label>
        <label><input type="checkbox" {...register('groupsEnabled')} /> Groups feature</label>
        <button type="submit">Save Mobile Config</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {saved ? (
        <article className="detail-card">
          <h4>Current Config</h4>
          <pre>{JSON.stringify(saved, null, 2)}</pre>
        </article>
      ) : null}
    </section>
  );
}

