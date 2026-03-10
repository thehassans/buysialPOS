import { PrismaClient } from '@prisma/client';

// Usually, there's a single prisma instance exported from lib/prisma.ts or similar.
// We'll instantiate one here for standalone script usage if needed, or import it later.
const prisma = new PrismaClient();

const ONLINE_PORTAL_URL = process.env.ONLINE_PORTAL_URL || 'https://api.yourdomain.com';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID || 'default-tenant-id';
const API_KEY = process.env.SYNC_API_KEY || 'default-api-key';

export class SyncEngine {
  /**
   * Pushes local pending changes to the online portal.
   */
  async pushLocalChanges() {
    console.log('[Sync] Starting Push Sync...');
    const pendingItems = await prisma.syncQueue.findMany({
      where: { status: 'PENDING' },
      take: 50, // Process in batches
    });

    if (pendingItems.length === 0) {
      console.log('[Sync] No pending items to push.');
      return;
    }

    try {
      const response = await fetch(`${ONLINE_PORTAL_URL}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-Tenant-ID': TENANT_ID
        },
        body: JSON.stringify({ items: pendingItems }),
      });

      if (!response.ok) {
        throw new Error(`Push sync failed with status ${response.status}`);
      }

      // Mark items as synced
      const syncedIds = pendingItems.map(item => item.id);
      await prisma.syncQueue.updateMany({
        where: { id: { in: syncedIds } },
        data: { status: 'SYNCED' },
      });
      console.log(`[Sync] Successfully pushed ${pendingItems.length} items.`);

    } catch (error) {
      console.error('[Sync] Push Sync Error:', error);
    }
  }

  /**
   * Pulls remote changes (like Menu updates) from the online portal.
   */
  async pullRemoteChanges() {
    console.log('[Sync] Starting Pull Sync...');
    try {
      const response = await fetch(`${ONLINE_PORTAL_URL}/api/sync/pull?tenantId=${TENANT_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Pull sync failed with status ${response.status}`);
      }

      const data = await response.json();
      const { menuItems, users } = data;

      // Upsert Menu Items
      if (menuItems && menuItems.length > 0) {
        for (const item of menuItems) {
          await prisma.menuItem.upsert({
            where: { id: item.id },
            update: item,
            create: item,
          });
        }
        console.log(`[Sync] Synced ${menuItems.length} menu items.`);
      }

      // Upsert Users
      if (users && users.length > 0) {
        for (const user of users) {
          await prisma.user.upsert({
            where: { id: user.id },
            update: user,
            create: user,
          });
        }
        console.log(`[Sync] Synced ${users.length} users.`);
      }

    } catch (error) {
      console.error('[Sync] Pull Sync Error:', error);
    }
  }

  /**
   * Run a full sync cycle
   */
  async runFullSync() {
    if (!navigator.onLine && typeof window !== 'undefined') {
       console.log('[Sync] Offline. Skipping sync.');
       return;
    }
    await this.pushLocalChanges();
    await this.pullRemoteChanges();
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();

// Optional: function to enqueue an operation locally
export async function enqueueSyncOperation(entity: string, entityId: string, operation: 'CREATE'|'UPDATE'|'DELETE', payload: any) {
  try {
     await prisma.syncQueue.create({
       data: {
         entity,
         entityId,
         operation,
         payload: JSON.stringify(payload),
         status: 'PENDING'
       }
     });
     console.log(`[Sync] Enqueued ${operation} for ${entity} ${entityId}`);
  } catch(e) {
     console.error('[Sync] Failed to enqueue sync operation', e);
  }
}
