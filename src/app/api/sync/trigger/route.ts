import { NextResponse } from 'next/server';
import { syncEngine } from '@/lib/syncService';

export async function POST() {
  try {
    await syncEngine.runFullSync();
    return NextResponse.json({ success: true, message: 'Sync completed' });
  } catch (error: any) {
    console.error('[Sync API] Trigger Error:', error);
    return NextResponse.json({ error: 'Sync failed', details: error.message }, { status: 500 });
  }
}
