import { prisma } from '@/lib/prisma';

// --- Types ---

export interface SettingsRecord {
  [key: string]: string;
}

export interface FeatureFlagItem {
  id: string;
  key: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
  updatedAt: Date;
}

class SettingsServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SettingsServiceError';
  }
}

// --- Service ---

export class SettingsService {
  static async getAll(): Promise<SettingsRecord> {
    try {
      const settings = await prisma.setting.findMany({
        select: { key: true, value: true },
      });

      const record: SettingsRecord = {};
      for (const s of settings) {
        record[s.key] = s.value;
      }

      return record;
    } catch (err) {
      throw new SettingsServiceError(
        `Failed to fetch settings: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'SETTINGS_FETCH_FAILED',
        500
      );
    }
  }

  static async update(key: string, value: string): Promise<{ key: string; value: string }> {
    if (!key || typeof key !== 'string') {
      throw new SettingsServiceError('Setting key is required', 'INVALID_KEY', 400);
    }

    if (typeof value !== 'string') {
      throw new SettingsServiceError('Setting value must be a string', 'INVALID_VALUE', 400);
    }

    try {
      const setting = await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
        select: { key: true, value: true },
      });

      return setting;
    } catch (err) {
      throw new SettingsServiceError(
        `Failed to update setting: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'SETTING_UPDATE_FAILED',
        500
      );
    }
  }

  static async getFeatureFlags(): Promise<FeatureFlagItem[]> {
    try {
      const flags = await prisma.featureFlag.findMany({
        select: {
          id: true,
          key: true,
          enabled: true,
          config: true,
          updatedAt: true,
        },
        orderBy: { key: 'asc' },
      });

      return flags.map((f) => ({
        id: f.id,
        key: f.key,
        enabled: f.enabled,
        config: f.config as Record<string, unknown> | null,
        updatedAt: f.updatedAt,
      }));
    } catch (err) {
      throw new SettingsServiceError(
        `Failed to fetch feature flags: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'FLAGS_FETCH_FAILED',
        500
      );
    }
  }

  static async toggleFlag(key: string): Promise<FeatureFlagItem> {
    if (!key || typeof key !== 'string') {
      throw new SettingsServiceError('Feature flag key is required', 'INVALID_KEY', 400);
    }

    try {
      const flag = await prisma.featureFlag.findUnique({
        where: { key },
        select: { id: true, enabled: true },
      });

      if (!flag) {
        throw new SettingsServiceError(
          `Feature flag "${key}" not found`,
          'FLAG_NOT_FOUND',
          404
        );
      }

      const updated = await prisma.featureFlag.update({
        where: { key },
        data: { enabled: !flag.enabled },
        select: {
          id: true,
          key: true,
          enabled: true,
          config: true,
          updatedAt: true,
        },
      });

      return {
        id: updated.id,
        key: updated.key,
        enabled: updated.enabled,
        config: updated.config as Record<string, unknown> | null,
        updatedAt: updated.updatedAt,
      };
    } catch (err) {
      if (err instanceof SettingsServiceError) throw err;
      throw new SettingsServiceError(
        `Failed to toggle feature flag: ${err instanceof Error ? err.message : 'Unknown error'}`,
        'FLAG_TOGGLE_FAILED',
        500
      );
    }
  }
}
