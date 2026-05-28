import NfcManager, { NfcEvents, NfcTech, Ndef } from 'react-native-nfc-manager';
import type { TagEvent } from 'react-native-nfc-manager';
import type { OpenSpoolTag } from '../types';

export function parseNdefTag(tag: TagEvent): OpenSpoolTag | null {
  if (!tag.ndefMessage || tag.ndefMessage.length === 0) {
    return null;
  }
  const record = tag.ndefMessage[0];
  if (!record) {
    return null;
  }

  const mimeType = Ndef.util.bytesToString(record.type as number[]);
  if (mimeType !== 'application/json') {
    return null;
  }

  try {
    const payload = Ndef.util.bytesToString(record.payload as number[]);
    const data = JSON.parse(payload) as Partial<OpenSpoolTag>;
    if (data.protocol !== 'openspool') {
      return null;
    }
    return data as OpenSpoolTag;
  } catch {
    return null;
  }
}

export async function startForegroundDispatch(
  onTag: (tag: OpenSpoolTag) => void,
): Promise<void> {
  NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
    const parsed = parseNdefTag(tag);
    if (parsed) {
      onTag(parsed);
    }
  });
  await NfcManager.registerTagEvent();
}

export async function stopForegroundDispatch(): Promise<void> {
  NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
  await NfcManager.unregisterTagEvent().catch(() => {});
}

export async function getLaunchTag(): Promise<OpenSpoolTag | null> {
  try {
    const tag = await NfcManager.getLaunchTagEvent();
    if (!tag) {
      return null;
    }
    return parseNdefTag(tag);
  } catch {
    return null;
  }
}

export async function readTagOnce(): Promise<OpenSpoolTag | null> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    if (!tag) {
      return null;
    }
    return parseNdefTag(tag);
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}
