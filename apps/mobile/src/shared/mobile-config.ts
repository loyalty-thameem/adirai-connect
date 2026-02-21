export type MobileConfig = {
  minAndroidVersion: string;
  minIosVersion: string;
  maintenanceMode: boolean;
  forceUpdate: boolean;
  pushEnabled: boolean;
  apiTimeoutMs: number;
};

export const mobileConfig: MobileConfig = {
  minAndroidVersion: '1.0.0',
  minIosVersion: '1.0.0',
  maintenanceMode: false,
  forceUpdate: false,
  pushEnabled: true,
  apiTimeoutMs: 12000,
};

