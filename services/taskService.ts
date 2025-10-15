import { Task } from '../types';
import { MOCK_TASKS } from '../constants';
import { getData, saveData } from './dataService';

const TASKS_STORAGE_KEY = 'pr-tasks';

export const getTasks = (): Task[] => {
  return getData<Task[]>(TASKS_STORAGE_KEY, MOCK_TASKS);
};

export const saveTasks = (tasks: Task[]): void => {
  saveData<Task[]>(TASKS_STORAGE_KEY, tasks);
};

export const addTask = (newTask: Task): Task[] => {
  const tasks = getTasks();
  const updatedTasks = [...tasks, newTask];
  saveTasks(updatedTasks);
  return updatedTasks;
};

export const updateTask = (updatedTask: Task): Task[] => {
  const tasks = getTasks();
  const updatedTasks = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
  saveTasks(updatedTasks);
  return updatedTasks;
};

export const deleteTask = (taskId: string): Task[] => {
    const tasks = getTasks();
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    saveTasks(updatedTasks);
    return updatedTasks;
}
