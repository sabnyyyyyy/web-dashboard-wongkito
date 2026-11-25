'use server';

import { updateTag } from 'next/cache';
import { STORE_INFO_TAG } from '@/lib/server/backend';

// Called by the Settings page after a successful save, so the cached store info on the login
// page shows the new name/address straight away instead of after the 5-minute revalidation.
export async function refreshStoreInfo() {
  updateTag(STORE_INFO_TAG);
}
