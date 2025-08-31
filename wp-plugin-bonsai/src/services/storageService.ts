// START ./wp-plugin-bonsai/src/services/storageService.ts
import { get, set } from 'idb-keyval';
import type { Workspace, ProviderStatus } from '@/types';

const WORKSPACES_KEY = 'ai-dev-assistant-workspaces-v2';
const PROVIDER_STATUS_KEY = 'ai-dev-assistant-provider-status-v1';

export async function saveWorkspaces(workspaces: Workspace[]): Promise<void> {
    try {
        await set(WORKSPACES_KEY, workspaces);
    } catch (error) {
        console.error("Failed to save workspaces to IndexedDB", error);
    }
}

export async function loadWorkspaces(): Promise<Workspace[]> {
    try {
        const workspaces = await get<Workspace[]>(WORKSPACES_KEY);
        // Basic migration: If old structure is found, clear it.
        if (workspaces && workspaces.length > 0 && !('history' in workspaces[0])) {
            console.log("Old workspace version detected, starting fresh.");
            return [];
        }
        return workspaces || [];
    } catch (error) {
        console.error("Failed to load workspaces from IndexedDB", error);
        return [];
    }
}

// Fix: Add function to save provider status to IndexedDB.
export async function saveProviderStatus(status: ProviderStatus): Promise<void> {
    try {
        await set(PROVIDER_STATUS_KEY, status);
    } catch (error) {
        console.error("Failed to save provider status to IndexedDB", error);
    }
}

// Fix: Add function to load provider status from IndexedDB.
export async function loadProviderStatus(): Promise<ProviderStatus | undefined> {
    try {
        return await get<ProviderStatus>(PROVIDER_STATUS_KEY);
    } catch (error) {
        console.error("Failed to load provider status from IndexedDB", error);
        return undefined;
    }
}
// END ./wp-plugin-bonsai/src/services/storageService.ts
