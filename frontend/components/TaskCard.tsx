'use client';

import { useState } from 'react';
import { api, Task } from '@/lib/api';
import TaskForm from './TaskForm';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (task: Task) => void;
}

export default function TaskCard({ task, onToggleComplete, onDelete, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleComplete = async () => {
    onToggleComplete(task.id, !task.completed);
  };

  const handleDelete = async () => {
    try {
      await api.deleteTask(task.id);
      onDelete(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdate = (updatedTask: Task) => {
    onUpdate(updatedTask);
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`border rounded-xl shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
      task.completed
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
        : 'bg-white border-gray-200'
    }`}>
      {isEditing ? (
        <div className="p-5">
          <TaskForm
            initialTask={task}
            onCancel={() => setIsEditing(false)}
            onTaskCreated={handleUpdate}
          />
        </div>
      ) : (
        <div className="p-5">
          <div className="flex items-start">
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`flex-shrink-0 h-5 w-5 mt-0.5 rounded-full border flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                task.completed
                  ? 'bg-green-500 border-green-500'
                  : 'bg-white border-gray-300 hover:border-indigo-400'
              }`}
              aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {task.completed && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="ml-3 flex-1 min-w-0">
              <h3 className={`text-base font-semibold ${
                task.completed
                  ? 'text-gray-500 line-through decoration-gray-400'
                  : 'text-gray-900'
              }`}>
                {task.title}
              </h3>
              {task.description && (
                <p className={`text-sm mt-1 ${
                  task.completed
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}>
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  task.completed
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {task.completed ? 'Completed' : 'Pending'}
                </span>

                {task.priority && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    task.priority === 'high' ? 'bg-red-100 text-red-800' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                )}

                {task.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {task.category}
                  </span>
                )}

                {task.due_date && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    new Date(task.due_date) < new Date() && !task.completed
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}

                <span className="text-xs text-gray-400">
                  Created: {formatDate(task.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>

            {isDeleting ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Confirm
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsDeleting(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}