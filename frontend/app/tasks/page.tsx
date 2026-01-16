'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, Task } from '@/lib/api';
import TaskForm from '@/components/TaskForm';
import TaskCard from '@/components/TaskCard';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created' | 'title' | 'priority' | 'due_date'>('created');
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Define loadTasks function using a ref to avoid dependency issues
  const loadTasksRef = useRef<() => Promise<void>>();

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      params.append('sort', sortBy);

      const queryString = params.toString();
      const response = await api.getTasks(queryString ? `?${queryString}` : '');
      setTasks(response.tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Store the function in the ref so it can be accessed by other callbacks
  loadTasksRef.current = loadTasks;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    } else if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated, isLoading, router]);

  // Debounce function for search and filter changes
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const debouncedLoadTasks = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (loadTasksRef.current) {
        loadTasksRef.current();
      }
    }, 150); // Reduced delay to 150ms for faster response
  }, []);

  const handleTaskCreated = (newTask: Task) => {
    setTasks([newTask, ...tasks]);
    setShowForm(false);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const handleTaskDeleted = (deletedTaskId: string) => {
    setTasks(tasks.filter(task => task.id !== deletedTaskId));
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const updatedTask = await api.toggleTaskCompletion(taskId, completed);
      handleTaskUpdated(updatedTask);
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">Your Tasks</h2>
                <p className="text-indigo-100 mt-1">Manage your daily activities</p>
              </div>

              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <div className="flex-grow min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      debouncedLoadTasks();
                    }}
                    className="w-full px-4 py-2 rounded-lg text-gray-900 bg-white bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as 'all' | 'pending' | 'completed');
                      debouncedLoadTasks();
                    }}
                    className="px-3 py-2 rounded-lg text-gray-900 bg-white bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white text-sm min-w-[110px]"
                  >
                    <option value="all">Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Done</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value as 'all' | 'low' | 'medium' | 'high');
                      debouncedLoadTasks();
                    }}
                    className="px-3 py-2 rounded-lg text-gray-900 bg-white bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white text-sm min-w-[110px]"
                  >
                    <option value="all">Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Med</option>
                    <option value="low">Low</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as 'created' | 'title' | 'priority' | 'due_date');
                      debouncedLoadTasks();
                    }}
                    className="px-3 py-2 rounded-lg text-gray-900 bg-white bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white text-sm min-w-[130px]"
                  >
                    <option value="created">Sort: Created</option>
                    <option value="title">Sort: Title</option>
                    <option value="priority">Sort: Priority</option>
                    <option value="due_date">Sort: Due</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowForm(!showForm)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-white bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                >
                  {showForm ? (
                    <>
                      <svg className="-ml-1 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Task
                    </>
                  )}
                </button>
              </div>
            </div>

            {showForm && (
              <div className="mt-6">
                <TaskForm onTaskCreated={handleTaskCreated} />
              </div>
            )}
          </div>

          <div className="px-6 py-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full">
                  <svg className="h-16 w-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks yet</h3>
                <p className="mt-1 text-gray-500">Get started by creating your first task.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onDelete={handleTaskDeleted}
                    onUpdate={handleTaskUpdated}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}