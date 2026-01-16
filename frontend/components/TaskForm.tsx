'use client';

import { useState } from 'react';
import { api, Task } from '@/lib/api';

interface TaskFormProps {
  onTaskCreated: (task: Task) => void;
  onCancel?: () => void;
  initialTask?: Task;
}

export default function TaskForm({ onTaskCreated, onCancel, initialTask }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(initialTask?.priority || 'medium');
  const [category, setCategory] = useState(initialTask?.category || '');
  const [dueDate, setDueDate] = useState(initialTask?.due_date || '');
  const [recurrencePattern, setRecurrencePattern] = useState(initialTask?.recurrence_pattern || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);

    try {
      // Format the due date properly for the backend
      let formattedDueDate: string | undefined = undefined;
      if (dueDate && typeof dueDate === 'string' && dueDate.trim() !== '') {
        // Ensure the date is in YYYY-MM-DD format that the backend expects
        formattedDueDate = dueDate; // Date input already returns YYYY-MM-DD format
      }

      if (initialTask) {
        // Update existing task
        const updatedTask = await api.updateTask(initialTask.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
          category,
          due_date: formattedDueDate,
          recurrence_pattern: recurrencePattern || undefined
        });

        // Call onTaskCreated to notify parent component of the update
        onTaskCreated(updatedTask);

        // Close the form
        if (onCancel) onCancel();
      } else {
        // Create new task
        const newTask = await api.createTask(title.trim(), description.trim(), priority, category, formattedDueDate, recurrencePattern);
        onTaskCreated(newTask);
        setTitle('');
        setDescription('');
        setPriority('medium'); // Reset to default priority
        setCategory(''); // Reset category
        setDueDate(''); // Reset due date
        setRecurrencePattern(''); // Reset recurrence pattern
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 flex items-center p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <svg className="flex-shrink-0 w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
              placeholder="Task title"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
              placeholder="Task description"
              disabled={loading}
            />
          </div>

          {/* Priority Selection */}
          <div className="mb-4">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
              disabled={loading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Category Input */}
          <div className="mb-4">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
              placeholder="Work, Personal, etc."
              disabled={loading}
            />
          </div>

          {/* Due Date Input */}
          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
              Due Date (optional)
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
              disabled={loading}
            />
          </div>

          {/* Recurrence Pattern Input */}
          <div className="mb-4">
            <label htmlFor="recurrencePattern" className="block text-sm font-medium text-gray-700">
              Recurrence Pattern (optional)
            </label>
            <select
              id="recurrencePattern"
              value={recurrencePattern}
              onChange={(e) => setRecurrencePattern(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 bg-white"
              disabled={loading}
            >
              <option value="">No recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Automatically create this task again based on the selected pattern.</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : initialTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}