import axios from 'axios'

const API_BASE = '/api/v1'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// Attach JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodbridge_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('foodbridge_token')
      localStorage.removeItem('foodbridge_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

// ── Donations ─────────────────────────────────────────────────────────────────
export const donationApi = {
  getDonorProfile: () => api.get('/donations/donor/profile'),
  createDonorProfile: (data) => api.post('/donations/donor/profile', data),
  createDonation: (data) => api.post('/donations/', data),
  listDonations: (params) => api.get('/donations/', { params }),
  getDonation: (id) => api.get(`/donations/${id}`),
  uploadImage: (id, formData) => api.post(`/donations/${id}/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  suggestPickupAddress: (query) => api.get('/locations/suggest', { params: { query } }),
}

// ── NGO ───────────────────────────────────────────────────────────────────────
export const ngoApi = {
  getNgoProfile: () => api.get('/ngo/profile'),
  createNgoProfile: (data) => api.post('/ngo/profile', data),
  listNgos: () => api.get('/ngo/all'),
  createFoodRequest: (data) => api.post('/ngo/food-requests', data),
  getMatches: () => api.get('/ngo/matches'),
  acceptMatch: (matchId) => api.post(`/ngo/matches/${matchId}/accept`),
  getDemandPrediction: () => api.get('/ngo/demand-prediction'),
}

// ── Volunteer ─────────────────────────────────────────────────────────────────
export const volunteerApi = {
  getProfile: () => api.get('/volunteer/profile'),
  createProfile: (params) => api.post('/volunteer/profile', null, { params }),
  getAssignments: () => api.get('/volunteer/assignments'),
  acceptAssignment: (matchId) => api.post(`/volunteer/assignments/${matchId}/accept`),
  confirmPickup: (matchId) => api.post(`/volunteer/assignments/${matchId}/pickup-confirmed`),
  confirmDelivery: (matchId) => api.post(`/volunteer/assignments/${matchId}/delivered`),
  toggleAvailability: (available) => api.patch('/volunteer/availability', null, {
    params: { is_available: available }
  }),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getAnalytics: () => api.get('/dashboard/analytics'),
  getNotifications: () => api.get('/dashboard/notifications'),
  markRead: (id) => api.patch(`/dashboard/notifications/${id}/read`),
}

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  getDonationReport: (format = 'json') => api.get('/reports/donation', { params: { format } }),
  getAnalyticsReport: () => api.get('/reports/analytics'),
}

export default api
