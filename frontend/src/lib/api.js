const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
const AUTH_STORAGE_KEY = "financeai.auth";

function getStoredSession() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function getAuthToken() {
  return getStoredSession()?.token || "";
}

function getStoredUser() {
  return getStoredSession()?.user || null;
}

function setAuthSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function redirectToAuth() {
  if (window.location.pathname !== "/auth") {
    window.location.assign("/auth");
  }
}

async function parseError(response, fallbackMessage) {
  try {
    const data = await response.json();
    return data.detail || data.message || fallbackMessage;
  } catch (error) {
    return fallbackMessage;
  }
}

async function requestJson(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = new Error(await parseError(response, `Request failed: ${response.status}`));
    error.status = response.status;
    if (response.status === 401) {
      clearAuthSession();
      redirectToAuth();
    }
    throw error;
  }

  return response.json();
}

async function uploadFile(path, file) {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const error = new Error(await parseError(response, `Upload failed: ${response.status}`));
    error.status = response.status;
    if (response.status === 401) {
      clearAuthSession();
      redirectToAuth();
    }
    throw error;
  }

  return response.json();
}

async function downloadFile(path, filename) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    const error = new Error(await parseError(response, `Download failed: ${response.status}`));
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "financeai-report";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export {
  API_BASE,
  clearAuthSession,
  downloadFile,
  getAuthToken,
  getStoredUser,
  requestJson,
  setAuthSession,
  uploadFile,
};
