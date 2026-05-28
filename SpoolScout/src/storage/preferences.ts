import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings } from '../types';

const KEYS = {
  SPOOLMAN_URL: 'spoolman_url',
  MOONRAKER_URL: 'moonraker_url',
  BRAND_PREFIX: 'brand_override_',
} as const;

export async function getSettings(): Promise<AppSettings> {
  const [spoolmanUrl, moonrakerUrl] = await AsyncStorage.multiGet([
    KEYS.SPOOLMAN_URL,
    KEYS.MOONRAKER_URL,
  ]);
  return {
    spoolmanUrl: spoolmanUrl[1] ?? '',
    moonrakerUrl: moonrakerUrl[1] ?? '',
  };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const pairs: [string, string][] = [];
  if (settings.spoolmanUrl !== undefined) {
    pairs.push([KEYS.SPOOLMAN_URL, settings.spoolmanUrl]);
  }
  if (settings.moonrakerUrl !== undefined) {
    pairs.push([KEYS.MOONRAKER_URL, settings.moonrakerUrl]);
  }
  if (pairs.length > 0) {
    await AsyncStorage.multiSet(pairs);
  }
}

export async function getBrandOverride(vendorId: number): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.BRAND_PREFIX + vendorId);
}

export async function setBrandOverride(vendorId: number, override: string): Promise<void> {
  const key = KEYS.BRAND_PREFIX + vendorId;
  if (override.trim() === '') {
    await AsyncStorage.removeItem(key);
  } else {
    await AsyncStorage.setItem(key, override.trim());
  }
}

export async function getAllBrandOverrides(): Promise<Record<number, string>> {
  const allKeys = await AsyncStorage.getAllKeys();
  const brandKeys = allKeys.filter(k => k.startsWith(KEYS.BRAND_PREFIX));
  if (brandKeys.length === 0) {
    return {};
  }
  const pairs = await AsyncStorage.multiGet(brandKeys);
  const result: Record<number, string> = {};
  for (const [key, value] of pairs) {
    if (value) {
      const id = parseInt(key.replace(KEYS.BRAND_PREFIX, ''), 10);
      if (!isNaN(id)) {
        result[id] = value;
      }
    }
  }
  return result;
}
