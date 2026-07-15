import {Navigate, Outlet} from "react-router";
import useStore from "../store";
import Navbar from "../Components/Navbar";
import {useEffect} from "react";
import {baseUrl} from "../baseUrl";
import {BibleDataRow} from "../Types/BibleDataRow";
import {BibleDataFetchResult} from "../Types/BibleDataFetchResult";

function MainLayout() {
    const store = useStore();
    const loginToken = store.loginToken;
    const connectToLogs = store.connectToLogs;
    const fetchSyncHistoryData = store.fetchSyncHistoryData;
    const connectToSyncHistoryData = store.connectToSyncHistoryData;

    const getBibleSyncData = async () => {
        try {
            const result = await fetch(`${baseUrl}/bible/syncer/data`, {
                headers: {
                    Authorization: `Bearer ${loginToken}`,
                },
            });
            if (!result.ok) {
                console.error('Error fetching Bible sync data', result.text)
                return;
            }
            const data: BibleDataFetchResult[] = await result.json();
            const rowData: BibleDataRow[] = data.map((item) => ({
                id: item.bible.id,
                abbreviation: item.bible.abbreviationLocal,
                name: item.bible.nameLocal,
                status: 0,
                lastSync: item.lastSyncReport ? item.lastSyncReport : null,
                nextScheduledSync: item.bible.nextScheduledAutoSync ? item.bible.nextScheduledAutoSync : null,
                active: item.bible.active,
                sync: 0
            }));
            store.setBibleTableData(rowData);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if (loginToken) {
            connectToLogs();

            // Fetch the most recent sync history first, then open the
            // SignalR connection — this is a one-time app-load sequence, so
            // there's no live data yet to race against or merge with. If the
            // fetch fails we still want live updates going forward, so we
            // connect regardless.
            fetchSyncHistoryData()
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    connectToSyncHistoryData().catch((error) => {
                        console.error(error);
                    });
                });

            getBibleSyncData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginToken, connectToLogs, fetchSyncHistoryData, connectToSyncHistoryData]);

    if (!loginToken) {
        return <Navigate to="/login" />
    }

    return (
        <div className="vw-100 vh-100 d-flex flex-row overflow-hidden">
            <Navbar />
            <main className="grow h-100 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}

export default MainLayout