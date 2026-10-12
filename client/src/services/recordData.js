export function requestError(error, action) {
  const status = error.response?.status;
  const detail = error.response?.data?.error || error.response?.data?.message || error.message;
  if (status === 401) return `${action}: your session has expired. Sign in again.`;
  if (status === 403) return `${action}: ${detail || 'your account is not authorized for this record.'}`;
  if (!error.response && !status) return `${action}: ${detail || 'the application server could not be reached.'}`;
  return `${action}${status ? ` (${status})` : ''}: ${detail || 'the server could not complete the request.'}`;
}

export function isCancelled(error, signal) {
  return Boolean(signal?.aborted || error?.code === 'ERR_CANCELED' || error?.name === 'AbortError' || error?.name === 'CanceledError');
}

export function recordList(response, page = 1, limit = 20) {
  const payload = response.data;
  const items = Array.isArray(payload) ? payload : payload?.data;
  if (!Array.isArray(items)) throw new Error('The server returned an invalid record list. Retry after checking the application server.');
  const header = key => response.headers?.get?.(key) ?? response.headers?.[key];
  const total = Number(payload?.pagination?.total ?? header('x-total-count') ?? items.length);
  if (!Number.isSafeInteger(total) || total < 0) throw new Error('The server returned an invalid record count.');
  return {
    items,
    pagination: { page: Number(payload?.pagination?.page ?? page), limit, total, totalPages: Math.max(1, Number(payload?.pagination?.totalPages ?? header('x-total-pages') ?? Math.ceil(total / limit))) },
    capabilities: { ...payload?.capabilities, ...(payload?.editableFields ? { editableFields: payload.editableFields } : {}) },
  };
}

export function recordDetail(response) {
  const payload = response.data;
  const item = payload?.item || payload;
  if (!item || typeof item !== 'object' || Array.isArray(item) || item.id === undefined) throw new Error('The server returned an invalid record detail.');
  return { item, capabilities: { ...(payload?.capabilities || item.capabilities || {}), ...(item.editableFields || payload?.editableFields ? { editableFields: item.editableFields || payload.editableFields } : {}) } };
}

export function demoLabel(item) {
  return item?.is_demo || item?.is_synthetic_demo || item?.demo_label ? item.demo_label || 'Synthetic demo · not case evidence' : '';
}
