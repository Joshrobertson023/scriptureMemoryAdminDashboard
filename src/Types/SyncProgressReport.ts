import {ExceptionModel} from "./ExceptionModel";

export interface SyncProgressReport {
    id: number;
    initiator?: string | null;
    bibleId: string;
    bibleName?: string | null;
    percentage: number;
    event?: string | null;
    message?: string | null;
    systemInitiated: boolean;
    exception?: ExceptionModel | string | null;
    timestamp: Date | string;
}