// store.ts
import { create } from 'zustand';
import { baseUrl } from './baseUrl';
import type { Admin } from './Types/Admin';
import { jwtDecode } from "jwt-decode";
import * as signalR from '@microsoft/signalr';
import { BibleDataRow } from "./Types/BibleDataRow";
import { SyncHistoryRow } from "./Types/SyncHistoryRow";
import { SyncProgressReport } from "./Types/SyncProgressReport";
import { BibleSyncStatus } from "./Types/BibleSyncStatus";
import {getBibleById} from "./Api";

export interface SignalRLog {
    timestamp: string;
    level: string;
    message: string;
}

interface Store {
    admin: Admin | null;
    loginToken: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;

    logs: SignalRLog[];
    logConnection: signalR.HubConnection | null;
    addLog: (log: SignalRLog) => void;
    connectToLogs: () => Promise<void>;
    disconnectFromLogs: () => Promise<void>;

    bibleTableData: BibleDataRow[];
    setBibleTableData: (data: BibleDataRow[]) => void;
    updateBibleTableData: (name: string, updates: Partial<Omit<BibleDataRow, 'name'>>) => void;

    syncHistoryData: SyncHistoryRow[];
    bibleSyncStatuses: Record<string, BibleSyncStatus>;
    waitingForSync: string[];
    waitingForCancel: string[];
    setSyncHistoryData: (data: SyncHistoryRow[]) => void;
    addSyncHistoryData: (row: SyncHistoryRow) => void;
    fetchSyncHistoryData: () => Promise<void>;
    queueBibleSync: (bibleId: string) => Promise<void>;
    cancelBibleSync: (bibleId: string, bibleName: string) => Promise<void>;
    syncHistoryDataConnection: signalR.HubConnection | null;
    connectToSyncHistoryData: () => Promise<void>;
    disconnectFromSyncHistoryData: () => Promise<void>;
}

interface AdminTokenClaims {
    sub: string;
    name: string;
    role: string;
}

const getInitialAdmin = (): Admin | null => {
    const token = localStorage.getItem('loginToken');

    if (!token) {
        return null;
    }

    try {
        const claims = jwtDecode<AdminTokenClaims>(token);

        return {
            userId: parseInt(claims.sub),
            username: claims.name,
        };
    } catch {
        localStorage.removeItem('loginToken');
        return null;
    }
};

// Maps the raw SignalR/API payload shape onto the row shape used in the UI.
export const normalizeSyncLog = (log: SyncProgressReport): SyncHistoryRow => {
    const exception = log.exception;

    return {
        id: log.id,
        bibleId: log.bibleId,
        bible: log.bibleName || log.bibleId,
        initiator: log.initiator || '',
        percentage: log.percentage || 0,
        action: log.event || '',
        message: log.message || '',
        timestamp: log.timestamp,
        error: typeof exception === 'string'
            ? exception
            : exception
                ? JSON.stringify(exception)
                : '',
    };
};

// A single SignalR message tells us everything we need to know about the
// current state of a bible's sync. Exported so anything that needs to seed
// or recompute status from a row can use the exact same rule the store does.
// Action values come straight from the server as-is (e.g. "Queued", "Progress");
// compare against them directly rather than lowercasing.
export const getSyncStatusFromLog = (row: SyncHistoryRow): BibleSyncStatus => {
    const action = row.action;

    if (action === 'Queued') {
        return { state: 'queued' };
    }

    if (action === 'Started') {
        return { state: 'syncing', percentage: 0 };
    }

    if (action === 'Progress') {
        return {
            state: 'syncing',
            percentage: Math.max(0, Math.min(100, row.percentage || 0)),
        };
    }

    // Stopped, Completed, Cancelled, etc. all reset to idle.
    return { state: 'idle' };
};

const buildBibleSyncStatuses = (logs: SyncHistoryRow[]): Record<string, BibleSyncStatus> => {
    const statuses: Record<string, BibleSyncStatus> = {};

    [...logs]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .forEach((log) => {
            statuses[log.bibleId] = getSyncStatusFromLog(log);
        });

    return statuses;
};

// Used to dedupe history rows. Falls back to a composite key when a row
// doesn't carry a reliable id (see notes on addSyncHistoryData below).
const historyRowKey = (row: SyncHistoryRow) =>
    row.id > 0
        ? row.id.toString()
        : `${row.bibleId}-${row.timestamp}-${row.action}-${crypto.randomUUID()}`;

const useStore = create<Store>((set, get) => ({
    admin: getInitialAdmin(),
    loginToken: localStorage.getItem('loginToken') || null,

    logs: [],
    logConnection: null,

    login: async (username: string, password: string) => {
        const response = await fetch(`${baseUrl}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid credentials.');
            }

            if (response.status >= 500) {
                throw new Error('Network error.');
            }

            throw new Error('There was a problem.');
        }

        const responseToken: string = await response.json();
        const claims = jwtDecode<AdminTokenClaims>(responseToken);

        set({
            loginToken: responseToken,
            admin: {
                userId: parseInt(claims.sub),
                username: claims.name,
            },
        });

        localStorage.setItem('loginToken', responseToken);
    },

    logout: () => {
        localStorage.removeItem('loginToken');

        get().disconnectFromLogs();
        get().disconnectFromSyncHistoryData();

        set({
            loginToken: null,
            admin: null,
            logs: [],
            syncHistoryData: [],
            bibleSyncStatuses: {},
            waitingForSync: [],
            waitingForCancel: [],
        });
    },

    addLog: (log: SignalRLog) => {
        set((state) => ({
            logs: [
                {
                    timestamp: log.timestamp,
                    level: log.level || 'Information',
                    message: log.message || '',
                },
                ...state.logs,
            ].slice(0, 1000),
        }));
    },

    connectToLogs: async () => {
        const existingConnection = get().logConnection;

        if (existingConnection) {
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/logs/stream`, {
                accessTokenFactory: () => get().loginToken || '',
            })
            .withAutomaticReconnect()
            .build();

        connection.on('ReceiveLog', (log: SignalRLog) => {
            get().addLog(log);
        });

        set({ logConnection: connection });

        try {
            await connection.start();
        } catch {
            set({ logConnection: null });
        }
    },

    disconnectFromLogs: async () => {
        const connection = get().logConnection;

        if (!connection) {
            return;
        }

        connection.off('ReceiveLog');
        await connection.stop();

        set({ logConnection: null });
    },

    bibleTableData: [],

    setBibleTableData: (data: BibleDataRow[]) => {
        set({ bibleTableData: data });
    },

    updateBibleTableData: (name, updates) => {
        set((state) => ({
            bibleTableData: state.bibleTableData.map((row) =>
                row.name === name ? { ...row, ...updates } : row
            ),
        }));
    },

    syncHistoryData: [],
    bibleSyncStatuses: {},
    waitingForSync: [],
    waitingForCancel: [],
    syncHistoryDataConnection: null,

    setSyncHistoryData: (data: SyncHistoryRow[]) => {
        set({ syncHistoryData: data });
    },

    // Prepends a live row and drops any existing row that represents the
    // same log entry. Dedup is keyed off historyRowKey rather than row.id
    // directly — see the note above historyRowKey's definition.
    addSyncHistoryData: (row: SyncHistoryRow) => {
        const newKey = historyRowKey(row);

        set((state) => ({
            syncHistoryData: [
                row,
                ...state.syncHistoryData.filter((log) => historyRowKey(log) !== newKey),
            ].slice(0, 1000),
        }));
    },

    // Seeds the History Logs table and bibleSyncStatuses on app load. This is
    // only ever called once, from MainLayout, and connectToSyncHistoryData is
    // held off until this resolves — so there's no live SignalR data yet to
    // race with or merge against. A plain replace is safe.
    fetchSyncHistoryData: async () => {
        const loginToken = get().loginToken;

        if (!loginToken) {
            return;
        }

        const response = await fetch(`${baseUrl}/bible/syncer/logs`, {
            headers: {
                Authorization: `Bearer ${loginToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Unable to fetch sync logs.');
        }

        const data: SyncProgressReport[] = await response.json();

        const fetchedRows = data
            .map(normalizeSyncLog)
            // Progress entries are never part of the history log.
            .filter((row) => row.action !== 'Progress')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 1000);

        set({
            syncHistoryData: fetchedRows,
            bibleSyncStatuses: buildBibleSyncStatuses(fetchedRows),
        });
    },

    // These two only kick off the request on the server. They track intent
    // via waitingForSync/waitingForCancel so the UI can show a spinner, but
    // deliberately do NOT touch bibleSyncStatuses/history directly — the
    // resulting SignalR message (Queued/Started/Cancelled/etc.) is what
    // updates the store and clears the waiting flag.
    queueBibleSync: async (bibleId: string) => {
        const loginToken = get().loginToken;
        const username = get().admin?.username;

        if (!loginToken || !username) {
            throw new Error('You must be logged in to queue a sync.');
        }

        set((state) => ({
            waitingForSync: state.waitingForSync.includes(bibleId)
                ? state.waitingForSync
                : [...state.waitingForSync, bibleId],
        }));

        try {
            const response = await fetch(`${baseUrl}/bible/syncer/${encodeURIComponent(bibleId)}/queue-sync`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${loginToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(username),
            });

            if (!response.ok) {
                throw new Error('Unable to queue Bible sync.');
            }
        } catch (error) {
            // The request never made it (or the server rejected it), so no
            // SignalR confirmation will ever arrive — clear the flag here.
            set((state) => ({
                waitingForSync: state.waitingForSync.filter((id) => id !== bibleId),
            }));
            throw error;
        }
    },

    cancelBibleSync: async (bibleId: string, bibleName: string) => {
        const loginToken = get().loginToken;
        const username = get().admin?.username;

        if (!loginToken || !username) {
            throw new Error('You must be logged in to cancel a sync.');
        }

        set((state) => ({
            waitingForCancel: state.waitingForCancel.includes(bibleId)
                ? state.waitingForCancel
                : [...state.waitingForCancel, bibleId],
        }));

        try {
            const response = await fetch(
                `${baseUrl}/bible/syncer/${encodeURIComponent(bibleId)}/${encodeURIComponent(bibleName)}/cancel-sync`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${loginToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(username),
                },
            );

            if (!response.ok) {
                throw new Error('Unable to cancel Bible sync.');
            }
        } catch (error) {
            set((state) => ({
                waitingForCancel: state.waitingForCancel.filter((id) => id !== bibleId),
            }));
            throw error;
        }
    },

    // Connection + event handling live here, together, so they're created
    // exactly once and persist for as long as the store does — independent
    // of whether any component that cares about sync history is mounted.
    // Called once from MainLayout, after fetchSyncHistoryData resolves, so
    // there's no need to reconcile against a REST fetch here.
    connectToSyncHistoryData: async () => {
        const existingConnection = get().syncHistoryDataConnection;

        if (existingConnection) {
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${baseUrl}/bible/syncer/stream`, {
                accessTokenFactory: () => get().loginToken || '',
            })
            .withAutomaticReconnect()
            .build();

        const handleIncoming = async (log: SyncProgressReport) => {
            const row = normalizeSyncLog(log);

            // Progress updates never show up in the history log.
            if (row.action !== 'Progress') {
                get().addSyncHistoryData(row);
            }


            set((state) => ({
                bibleSyncStatuses: {
                    ...state.bibleSyncStatuses,
                    [row.bibleId]: getSyncStatusFromLog(row),
                },
                // Any event for this bible means the server has responded to
                // whichever action we were waiting on — clear both, since we
                // can't always tell from a terminal action which one it was.
                waitingForSync: state.waitingForSync.filter((id) => id !== row.bibleId),
                waitingForCancel: state.waitingForCancel.filter((id) => id !== row.bibleId),
            }));

            console.log('Checking row status....')
            if (row.action === 'Completed') {
                console.log('Fetching updated bible...', row.bibleId)
                console.log('row.bibleId: ' + row.bibleId.toString())
                try {
                    const updatedBible = await getBibleById(row.bibleId);
                    console.log('Updated bible with sync date: ', updatedBible.lastSync);

                    set((state) => ({
                        bibleTableData: state.bibleTableData.map((row) => {
                            if (row.id === updatedBible.id)
                                console.log(updatedBible.lastSync, updatedBible.nextScheduledAutoSync)
                            return row.id === updatedBible.id ? {
                                id: updatedBible.id,
                                abbreviation: updatedBible.abbreviationLocal,
                                name: updatedBible.nameLocal,
                                status: 0,
                                sync: 0,
                                lastSync: updatedBible.lastSync,
                                nextScheduledSync: updatedBible.nextScheduledAutoSync,
                                active: updatedBible.active
                            } as BibleDataRow : row;
                        })
                    }))
                } catch (error) {
                    console.error(error);
                }
            }
        };

        connection.on('ReceiveLog', handleIncoming);
        connection.on('ReceiveProgress', handleIncoming);

        set({ syncHistoryDataConnection: connection });

        try {
            await connection.start();
        } catch {
            connection.off('ReceiveLog', handleIncoming);
            connection.off('ReceiveProgress', handleIncoming);
            set({ syncHistoryDataConnection: null });
        }
    },

    disconnectFromSyncHistoryData: async () => {
        const connection = get().syncHistoryDataConnection;

        if (!connection) {
            return;
        }

        connection.off('ReceiveLog');
        connection.off('ReceiveProgress');
        await connection.stop();

        set({ syncHistoryDataConnection: null });
    },
}));

export default useStore;