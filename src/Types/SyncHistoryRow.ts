export interface SyncHistoryRow {
    id: number;
    bibleId: string;
    bible: string;
    initiator: string;
    percentage: number;
    action: string;
    message: string;
    timestamp: Date | string;
    error: string;
}