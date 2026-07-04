export interface Bible {
    id: string;
    version: string;
    name: string;
    lastUpdated?: Date;
    syncError?: string;
}