const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nutrimate_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_URL}${endpoint}`;
    const defaultHeaders = getHeaders();
    
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`API Call Error (${endpoint}):`, error);
    throw error;
  }
};

export const authAPI = {
  register: (name, email, password) => 
    apiCall('/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => 
    apiCall('/auth/login', { method: 'POST', body: { email, password } }),
  getMe: () => 
    apiCall('/auth/me', { method: 'GET' }),
};

export const profileAPI = {
  getProfile: () => 
    apiCall('/profile', { method: 'GET' }),
  saveProfile: (profileData) => 
    apiCall('/profile', { method: 'POST', body: profileData }),
  updatePreferences: (prefData) => 
    apiCall('/profile/preferences', { method: 'PUT', body: prefData }),
};

export const pantryAPI = {
  getItems: () => 
    apiCall('/pantry', { method: 'GET' }),
  addItem: (item) => 
    apiCall('/pantry', { method: 'POST', body: item }),
  editItem: (id, item) => 
    apiCall(`/pantry/${id}`, { method: 'PUT', body: item }),
  deleteItem: (id) => 
    apiCall(`/pantry/${id}`, { method: 'DELETE' }),
  getExpiring: () => 
    apiCall('/pantry/expiring', { method: 'GET' }),
};

export const trackerAPI = {
  logMeal: (mealData) => 
    apiCall('/tracker/meal', { method: 'POST', body: mealData }),
  deleteMeal: (id) => 
    apiCall(`/tracker/meal/${id}`, { method: 'DELETE' }),
  getDaily: (dateStr) => 
    apiCall(`/tracker/daily/${dateStr}`, { method: 'GET' }),
  updateWater: (amount, dateStr) => 
    apiCall('/tracker/water', { method: 'POST', body: { amount, date: dateStr } }),
  getHistory: (filter) => 
    apiCall(`/tracker/history?filter=${filter}`, { method: 'GET' }),
};

export const chatAPI = {
  getHistory: () => 
    apiCall('/chat', { method: 'GET' }),
  sendMessage: (message) => 
    apiCall('/chat', { method: 'POST', body: { message } }),
  clearHistory: () => 
    apiCall('/chat', { method: 'DELETE' }),
};

export const plannerAPI = {
  getPlan: () => 
    apiCall('/planner', { method: 'GET' }),
  generatePlan: () => 
    apiCall('/planner/generate', { method: 'POST' }),
  getGrocery: () => 
    apiCall('/planner/grocery', { method: 'GET' }),
  generateGrocery: () => 
    apiCall('/planner/grocery/generate', { method: 'POST' }),
};
