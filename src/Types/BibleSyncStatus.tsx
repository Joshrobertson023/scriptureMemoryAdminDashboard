export type BibleSyncStatus =
    | { state: 'idle' }
    | { state: 'queued' }
    | { state: 'syncing'; percentage: number };