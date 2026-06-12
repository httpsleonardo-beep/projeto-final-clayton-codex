const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

async function request(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        const payload = await response.json();
        detail = payload?.detail || detail;
      } catch {
        // Keep the HTTP status as fallback.
      }

      console.error(`API Error: ${detail} - ${endpoint}`);
      return { __error: true, detail };
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request Failed: ${endpoint}`, error);
    return null;
  }
}

// ===== USERS =====
export async function fetchUsers() {
  return await request('/api/users');
}

export async function fetchUser(id) {
  return await request(`/api/users/${id}`);
}

// ===== DASHBOARD =====
export async function fetchDashboard(userId) {
  return await request(`/api/dashboard/${userId}`);
}

// ===== VEHICLES =====
export async function fetchVehicles(userId) {
  return await request(`/api/vehicles/${userId}`);
}

export async function createVehicle(data) {
  return await request('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteVehicle(id) {
  return await request(`/api/vehicles/${id}`, {
    method: 'DELETE',
  });
}

// ===== MAINTENANCES =====
export async function fetchMaintenances(vehicleId) {
  return await request(`/api/maintenances/${vehicleId}`);
}

export async function fetchUserMaintenances(userId) {
  return await request(`/api/maintenances/user/${userId}`);
}

export async function createMaintenance(data) {
  return await request('/api/maintenances', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteMaintenance(id) {
  return await request(`/api/maintenances/${id}`, {
    method: 'DELETE',
  });
}

// ===== ALERTS =====
export async function fetchAlerts(userId) {
  return await request(`/api/alerts/${userId}`);
}

// ===== SMART SCHEDULE =====
export async function fetchSmartSchedule(vehicleId) {
  return await request(`/api/smart-schedule/${vehicleId}`);
}
