import axios, { AxiosInstance } from 'axios';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  due_date?: string;
  recurrence_pattern?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    // Ensure the base URL is properly formed
    let baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://mubashirjatoi-todo-app-fullstack.hf.space';

    // For production, ensure we're using the correct backend URL
    if (typeof window !== 'undefined') {
      // Client-side runtime check
      if (window.location.hostname === 'frontend-xi-five-90.vercel.app') {
        baseURL = 'https://mubashirjatoi-todo-app-fullstack.hf.space';
      }
    }

    console.log('API Base URL:', baseURL); // Debug logging

    this.client = axios.create({
      baseURL: baseURL,
      timeout: 10000,
    });

    // Add request interceptor to include JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token expiration and other errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;

          try {
            // Attempt to refresh token or redirect to login
            // For now, we'll just redirect to login
            localStorage.removeItem('jwt_token');
            window.location.href = '/auth';
          } catch (refreshError) {
            // If refresh fails, redirect to login
            localStorage.removeItem('jwt_token');
            window.location.href = '/auth';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post('/api/auth/register', {
        email,
        password,
        name
      });
      if (response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      // Throw the error to be caught by the calling function
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post('/api/auth/login', {
        email,
        password
      });
      if (response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      // Throw the error to be caught by the calling function
      throw error;
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('jwt_token');
  }

  // Task methods
  async getTasks(queryParams: string = ''): Promise<{ tasks: Task[] }> {
    const response = await this.client.get(`/api/tasks${queryParams}`);
    return response.data;
  }

  async createTask(title: string, description?: string, priority?: 'low' | 'medium' | 'high', category?: string, due_date?: string, recurrence_pattern?: string): Promise<Task> {
    const response = await this.client.post('/api/tasks', {
      title,
      description,
      priority,
      category,
      due_date,
      recurrence_pattern
    });
    return response.data;
  }

  async getTaskById(id: string): Promise<Task> {
    const response = await this.client.get(`/api/tasks/${id}`);
    return response.data;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.client.put(`/api/tasks/${id}`, updates);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/api/tasks/${id}`);
  }

  async toggleTaskCompletion(id: string, completed: boolean): Promise<Task> {
    const response = await this.client.patch(`/api/tasks/${id}/complete`, {
      completed
    });
    return response.data;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('jwt_token');
  }
}

export const api = new ApiClient();
export type { Task, User, AuthResponse };