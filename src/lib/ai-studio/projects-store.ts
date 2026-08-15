import { AGRouterPromptResponse } from './schema';

export interface StudioProject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  aspectRatio: string;
  category: string;
  tags: string[];
  pinned: boolean;
  activeVersion: number;
  versionsCount: number;
  agRouterResponse: AGRouterPromptResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudioVersionSnapshot {
  id: string;
  projectId: string;
  versionNumber: number;
  promptText: string;
  negativePrompt?: string;
  modelTarget: string;
  addedCount: number;
  removedCount: number;
  createdAt: string;
}

const STORAGE_KEY_PROJECTS = 'prizom_ai_studio_projects_v2';
const STORAGE_KEY_SNAPSHOTS = 'prizom_ai_studio_snapshots_v2';

/**
 * Retrieves all studio projects from local storage / cache.
 */
export function getStudioProjects(): StudioProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse studio projects:', err);
    return [];
  }
}

/**
 * Saves or updates a project.
 */
export function saveStudioProject(project: Partial<StudioProject> & { id: string }): StudioProject[] {
  if (typeof window === 'undefined') return [];
  const existing = getStudioProjects();
  const idx = existing.findIndex((p) => p.id === project.id);

  const now = new Date().toISOString();
  let updatedList: StudioProject[];

  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...project, updatedAt: now };
    updatedList = [...existing];
  } else {
    const newProject: StudioProject = {
      id: project.id,
      title: project.title || 'Untitled Studio Project',
      description: project.description || 'AI image reverse engineering analysis',
      imageUrl: project.imageUrl || '',
      aspectRatio: project.aspectRatio || '1:1',
      category: project.category || 'Concept Art',
      tags: project.tags || ['ai-studio', 'v2'],
      pinned: project.pinned || false,
      activeVersion: project.activeVersion || 1,
      versionsCount: project.versionsCount || 1,
      agRouterResponse: project.agRouterResponse || null,
      createdAt: now,
      updatedAt: now
    };
    updatedList = [newProject, ...existing];
  }

  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedList));
  } catch (err) {
    console.error('Failed to save studio project:', err);
  }

  return updatedList;
}

/**
 * Toggles pinned status of a project.
 */
export function togglePinStudioProject(projectId: string): StudioProject[] {
  const existing = getStudioProjects();
  const updated = existing.map((p) => (p.id === projectId ? { ...p, pinned: !p.pinned } : p));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Deletes a project.
 */
export function deleteStudioProject(projectId: string): StudioProject[] {
  const existing = getStudioProjects();
  const updated = existing.filter((p) => p.id !== projectId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updated));
  }
  return updated;
}

/**
 * Calculates prompt text character additions and deletions.
 */
export function calculatePromptDiff(originalText: string, newText: string): { addedCount: number; removedCount: number } {
  const origWords = (originalText || '').split(/\s+/);
  const newWords = (newText || '').split(/\s+/);

  let added = 0;
  let removed = 0;

  const origSet = new Set(origWords);
  const newSet = new Set(newWords);

  newWords.forEach((w) => {
    if (!origSet.has(w)) added += w.length;
  });

  origWords.forEach((w) => {
    if (!newSet.has(w)) removed += w.length;
  });

  return { addedCount: added, removedCount: removed };
}

