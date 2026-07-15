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