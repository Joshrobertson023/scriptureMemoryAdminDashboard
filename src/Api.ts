import {Bible} from "./Types/Bible";
import {baseUrl} from "./baseUrl";
import useStore from "./store";

export const getBibleById = async (bibleId: string): Promise<Bible> => {
    const token = useStore.getState().loginToken;

    const response = await fetch(`${baseUrl}/bible/${bibleId}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Unable to fetch updated Bible");
    }

    return await response.json();
};

export const setBibleActive = async (bibleId: string, active: boolean): Promise<void> => {
    const token = useStore.getState().loginToken;
    const username = useStore.getState().admin.username;

    const response = await fetch(`${baseUrl}/bible/syncer/${bibleId}/${active ? 'set-visible' : 'set-not-visible'}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(username)
    });

    if (!response.ok)
        throw new Error("Unable to set Bible active");

    return;
}