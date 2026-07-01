export interface ImportProgress {
  current: number;
  total: number;
  running: boolean;
}

const store = new Map<string, ImportProgress>();

export function setProgress(name: string, p: ImportProgress): void {
  store.set(name, p);
}

export function getProgress(name: string): ImportProgress {
  return store.get(name) ?? { current: 0, total: 0, running: false };
}

export function clearProgress(name: string): void {
  store.delete(name);
}
