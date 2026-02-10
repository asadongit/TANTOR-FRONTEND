/**
 * Updates recent access for an entity (data/project) and refreshes the recent list.
 * @param {Object} params
 * @param {Object} params.row - The entity row object.
 * @param {string} params.entityType - 'data' or 'project'.
 * @param {string} params.hostnameAI - API host.
 * @param {string} params.token - Auth token.
 * @param {string} params.userId - User id.
 * @param {Function} params.setRecentList - Setter for recent list.
 * @param {Function} params.setRecentLoading - Setter for loading state.
 * @param {number} [params.limit=5] - Limit for recent list.
 */
export async function updateRecentAccess({
  row,
  entityType,
  hostnameAI,
  token,
  userId,
  setRecentList,
  setRecentLoading,
  limit = 5,
}) {
  try {
    if (!userId || !row || !hostnameAI || !token) return;
    let itemId, itemName;
    if (entityType === 'data') {
      itemId = row.id || row.dataset_id || row.uuid || row.file_id || row.file_name;
      itemName = row.file_name || row.dataset_name || row.name;
    } else if (entityType === 'project') {
      itemId = row.id;
      itemName = row.name;
    } else if (entityType === 'model') {
      itemId = row.id;
      itemName = row.run_name || row.name;
    }
    if (!itemId || !itemName) return;
    await fetch(
      `${hostnameAI}/canvas/entity/update_recent_access?user_id=${userId}&item_id=${itemId}&item_name=${encodeURIComponent(itemName)}&entity_type=${entityType}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      }
    );
    setRecentLoading(true);
    const resp = await fetch(
      `${hostnameAI}/canvas/entity/recent_access/list?user_id=${userId}&entity_type=${entityType}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (resp.ok) {
      const data = await resp.json();
      setRecentList(Array.isArray(data?.recent_entities) ? data.recent_entities : Array.isArray(data) ? data : []);
    }
    setRecentLoading(false);
  } catch {
    setRecentLoading(false);
  }
}

/**
 * Unarchives an entity (data/project/model).
 * @param {Object} params
 * @param {string} params.component - 'data', 'project', or 'model'.
 * @param {string} params.component_id - The ID of the component.
 * @param {string} params.hostnameAI - API host.
 * @param {string} params.token - Auth token.
 * @returns {Promise<boolean>} - True if successful, throws error otherwise.
 */
export async function unarchiveEntity({
  component,
  component_id,
  hostnameAI,
  token,
}) {
  const response = await fetch(`${hostnameAI}/canvas/unarchive`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      component,
      component_id,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to unarchive: ${response.statusText}`);
  }

  return true;
}
