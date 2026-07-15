export interface BibleDataRow {
    id: string;
    abbreviation: string;
    name: string;
    status: number;
    sync: number;
    lastSync?: Date;
    nextScheduledSync?: Date;
    active: boolean;
}