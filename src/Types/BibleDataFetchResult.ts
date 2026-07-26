import { Bible } from "./Bible";
import { SyncProgressReport } from "./SyncProgressReport";

export interface BibleSyncDataItem {
    bible: Bible;
    lastSyncReport: SyncProgressReport | null;
    syncInProgress: boolean;
}

export interface BibleDataFetchResult {
    currentlySyncing: boolean;
    lastSync: string | null;
    syncData: BibleSyncDataItem[];
}