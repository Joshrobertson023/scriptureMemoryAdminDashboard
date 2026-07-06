import { create } from 'zustand';
import { baseUrl } from './baseUrl'
import type { Admin } from './Types/Admin';
import {jwtDecode} from "jwt-decode";
import * as signalR from '@microsoft/signalr';

export interface SignalRLog {
    timestamp: string;
    level: string;
    message: string;
}

interface Store {
    admin: Admin | null;
    loginToken: string | null;
    logs: SignalRLog[];
    logConnection: signalR.HubConnection | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    addLog: (log: SignalRLog) => void;
    connectToLogs: () => Promise<void>;
    disconnectFromLogs: () => Promise<void>;
}

interface AdminTokenClaims {
    id: string;
    email: string;
    role: string;
}

const useStore = create<Store>((set, get) => ({
    admin: null,
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
                password
            })
        });

        const responseToken: string = await response.text();

        const claims = jwtDecode<AdminTokenClaims>(responseToken);

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid credentials.');
            }

            if (response.status >= 500) {
                throw new Error('Network error.');
            }

            throw new Error('There was a problem.');
        }

        set({
            loginToken: responseToken,
            admin: {userId: parseInt(claims.id), username: claims.email }
        });

        localStorage.setItem('loginToken', responseToken);
    },

    logout: () => {
        localStorage.removeItem('loginToken');

        get().disconnectFromLogs();

        set({loginToken: null, admin: null});
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
            .withUrl(`${baseUrl}/logs/stream`)
            .withAutomaticReconnect()
            .build();

        connection.on('ReceiveLog', (log: SignalRLog) => {
            get().addLog(log);
        });

        set({logConnection: connection});

        try {
            await connection.start();
        } catch {
            set({logConnection: null});
        }
    },

    disconnectFromLogs: async () => {
        const connection = get().logConnection;

        if (!connection) {
            return;
        }

        connection.off('ReceiveLog');
        await connection.stop();

        set({logConnection: null});
    }
}))

export default useStore