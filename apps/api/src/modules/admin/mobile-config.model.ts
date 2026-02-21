import { Schema, model } from 'mongoose';

const mobileConfigSchema = new Schema(
  {
    singleton: { type: String, unique: true, default: 'default' },
    minAndroidVersion: { type: String, default: '1.0.0' },
    minIosVersion: { type: String, default: '1.0.0' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: '' },
    forceUpdate: { type: Boolean, default: false },
    pushEnabled: { type: Boolean, default: true },
    apiTimeoutMs: { type: Number, default: 12000 },
    releaseChannel: { type: String, default: 'production' },
    featureFlags: {
      chatEnabled: { type: Boolean, default: true },
      marketplaceEnabled: { type: Boolean, default: false },
      pollsEnabled: { type: Boolean, default: true },
      groupsEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export const MobileConfigModel = model('MobileConfig', mobileConfigSchema);

