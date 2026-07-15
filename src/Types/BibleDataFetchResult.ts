import {Bible} from "./Bible";

export interface BibleDataFetchResult {
    bible: Bible;
    lastSyncReport?: Date | null;
}