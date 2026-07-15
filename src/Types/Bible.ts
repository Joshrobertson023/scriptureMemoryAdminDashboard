export interface Bible {
    id: string;
    abbreviation: string;
    abbreviationLocal: string;
    name: string;
    nameLocal: string;
    copyright: string;
    info: string;
    active: boolean;
    nextScheduledAutoSync: Date;
    lastSync?: Date;
}