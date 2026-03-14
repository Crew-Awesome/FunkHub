import { DownloadTask } from "./types";

type DownloadListener = (tasks: DownloadTask[]) => void;

interface DownloadJob {
  task: DownloadTask;
  run: (task: DownloadTask, update: (next: DownloadTask) => void) => Promise<void>;
  cancel: () => void;
}

function byPriorityAndTime(a: DownloadJob, b: DownloadJob): number {
  const priorityA = a.task.priority ?? 0;
  const priorityB = b.task.priority ?? 0;
  if (priorityA !== priorityB) {
    return priorityB - priorityA;
  }
  return a.task.createdAt - b.task.createdAt;
}

export class DownloadManager {
  private maxConcurrent: number;

  private active = 0;

  private tasks = new Map<string, DownloadTask>();

  private queue: DownloadJob[] = [];

  private jobs = new Map<string, DownloadJob>();

  private listeners = new Set<DownloadListener>();

  constructor(maxConcurrent = 3) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }

  subscribe(listener: DownloadListener): () => void {
    this.listeners.add(listener);
    listener(this.getTasks());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getTasks(): DownloadTask[] {
    return [...this.tasks.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  setMaxConcurrent(maxConcurrent: number): void {
    this.maxConcurrent = Math.max(1, maxConcurrent);
    this.pumpQueue();
  }

  enqueue(job: Omit<DownloadJob, "task"> & { task: Omit<DownloadTask, "status" | "createdAt" | "updatedAt" | "progress" | "downloadedBytes"> }): DownloadTask {
    const now = Date.now();
    const task: DownloadTask = {
      ...job.task,
      status: "queued",
      createdAt: now,
      updatedAt: now,
      progress: 0,
      downloadedBytes: 0,
    };

    const normalizedJob: DownloadJob = {
      ...job,
      task,
    };

    this.tasks.set(task.id, task);
    this.jobs.set(task.id, normalizedJob);
    this.queue.push(normalizedJob);
    this.queue.sort(byPriorityAndTime);
    this.emit();
    this.pumpQueue();
    return task;
  }

  cancel(taskId: string): void {
    const job = this.jobs.get(taskId);
    if (!job) {
      return;
    }

    job.cancel();
    this.queue = this.queue.filter((entry) => entry.task.id !== taskId);

    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.set(taskId, {
        ...task,
        status: "cancelled",
        updatedAt: Date.now(),
      });
      this.emit();
    }
  }

  update(taskId: string, nextTask: DownloadTask): void {
    if (!this.tasks.has(taskId)) {
      return;
    }
    this.updateTask({ ...nextTask, id: taskId });
  }

  private emit(): void {
    const snapshot = this.getTasks();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  private updateTask(next: DownloadTask): void {
    this.tasks.set(next.id, { ...next, updatedAt: Date.now() });
    this.emit();
  }

  private pumpQueue(): void {
    while (this.active < this.maxConcurrent && this.queue.length > 0) {
      const nextJob = this.queue.shift();
      if (!nextJob) {
        return;
      }

      this.active += 1;
      this.updateTask({ ...nextJob.task, status: "downloading" });

      nextJob
        .run(nextJob.task, (next) => this.updateTask(next))
        .then(() => {
          const latest = this.tasks.get(nextJob.task.id);
          if (latest && latest.status !== "cancelled" && latest.status !== "failed") {
            this.updateTask({ ...latest, status: "completed", progress: 1 });
          }
        })
        .catch((error) => {
          const latest = this.tasks.get(nextJob.task.id);
          if (latest && latest.status !== "cancelled") {
            this.updateTask({
              ...latest,
              status: "failed",
              error: error instanceof Error ? error.message : "Download failed",
            });
          }
        })
        .finally(() => {
          this.active -= 1;
          this.pumpQueue();
        });
    }
  }
}

export const downloadManager = new DownloadManager(3);
