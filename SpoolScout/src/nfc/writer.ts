import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import type { OpenSpoolTag, SpoolmanSpool } from '../types';
import { getBrandOverride } from '../storage/preferences';

// NTAG 213 capacity is too small (144 bytes). Require NTAG 215/216.
const MIN_TAG_BYTES = 250;

export function buildOpenSpoolPayload(
  spool: SpoolmanSpool,
  brandOverride: string | null,
): OpenSpoolTag {
  const filament = spool.filament;
  const vendorName = filament.vendor?.name ?? '';
  const brand = brandOverride ?? (vendorName || 'Generic');
  const temp = filament.settings_extruder_temp;

  return {
    protocol: 'openspool',
    version: '1.0',
    type: filament.material ?? '',
    color_hex: filament.color_hex ?? '000000',
    brand,
    min_temp: temp != null ? String(temp) : '0',
    max_temp: temp != null ? String(temp) : '0',
    spoolman_id: spool.id,
  };
}

export async function writeSpoolToTag(spool: SpoolmanSpool): Promise<void> {
  const vendorId = spool.filament.vendor?.id;
  const brandOverride = vendorId != null ? await getBrandOverride(vendorId) : null;
  const payload = buildOpenSpoolPayload(spool, brandOverride);
  const json = JSON.stringify(payload);

  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);

    // Check tag capacity via the NDEF handler to catch NTAG 213 (too small).
    const status = await NfcManager.ndefHandler.getNdefStatus();
    if (status.capacity < MIN_TAG_BYTES) {
      throw new Error(
        `Tag too small (${status.capacity} bytes). Use NTAG 215 or NTAG 216.`,
      );
    }

    const record = {
      tnf: Ndef.TNF_MIME_MEDIA,
      type: Ndef.util.stringToBytes('application/json'),
      id: [] as number[],
      payload: Ndef.util.stringToBytes(json),
    };

    const bytes = Ndef.encodeMessage([record]);
    if (!bytes) {
      throw new Error('Failed to encode NDEF message.');
    }

    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}
