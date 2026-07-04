import { create } from 'zustand';
import { baseUrl } from './baseUrl'
import type { Admin } from './Types/Admin';
import {jwtDecode} from "jwt-decode";

interface Store {
    admin: Admin | null;
    loginToken: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}

interface AdminTokenClaims {
    id: string;
    email: string;
    role: string;
}

const useStore = create<Store>((set) => ({
    admin: null,
    loginToken: localStorage.getItem('loginToken') || null,

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

        set({loginToken: null});
    }
}))

export default useStore