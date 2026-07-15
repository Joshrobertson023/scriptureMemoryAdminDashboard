export interface ExceptionModel {
    id: number;
    type: string;
    message: string;
    stackTrace?: string;
    source?: string;
    timestamp: Date;
}