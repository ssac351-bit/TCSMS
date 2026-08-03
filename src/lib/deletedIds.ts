/**
 * Deleted IDs tracking helper for Tanzil Microcredit Software.
 * This ensures that when any data is deleted, its unique ID is stored locally
 * and synchronized to the cloud, preventing deleted records from re-appearing.
 */

export const registerDeletedId = (orgId: string, id: string) => {
  if (!id) return;
  try {
    const key = `tanzil_deleted_ids_${orgId}`;
    const deletedIds: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(key, JSON.stringify(deletedIds));
      console.log(`[Deleted ID Registered] ${id}`);
    }
  } catch (err) {
    console.error('Error registering deleted ID:', err);
  }
};

export const getDeletedIds = (orgId: string): string[] => {
  try {
    const key = `tanzil_deleted_ids_${orgId}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (err) {
    console.error('Error getting deleted IDs:', err);
    return [];
  }
};

export const filterDeletedItems = <T extends { id?: string; memberId?: string; voucherId?: string }>(
  orgId: string,
  items: T[]
): T[] => {
  if (!items || !Array.isArray(items)) return [];
  const deletedIds = getDeletedIds(orgId);
  if (deletedIds.length === 0) return items;
  
  return items.filter(item => {
    const id = item.id;
    const memberId = item.memberId;
    const voucherId = item.voucherId;
    
    if (id && deletedIds.includes(String(id))) return false;
    if (memberId && deletedIds.includes(String(memberId))) return false;
    if (voucherId && deletedIds.includes(String(voucherId))) return false;
    return true;
  });
};
