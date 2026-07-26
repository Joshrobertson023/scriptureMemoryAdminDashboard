export interface Bible {
    id: string;
    abbreviation: string;
    abbreviationLocal: string;
    name: string;
    nameLocal: string;
    copyright: string | null;
    info: string;
    active: boolean;
    authorized: boolean;
    nextScheduledAutoSync: Date | null;
    lastSync?: Date | null;
}