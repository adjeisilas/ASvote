import axios from 'axios';
import { supabase } from './supabase';

const axiosInstance = axios.create({
  timeout: 60000,
});

// Request interceptor to add Supabase Auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
