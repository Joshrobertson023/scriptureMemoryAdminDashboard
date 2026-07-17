import {Navigate, Outlet, useNavigate} from "react-router";
import useStore from "../store";
import Navbar from "../Components/Navbar";
import { useEffect } from "react";

function MainLayout() {
    const store = useStore();
    const loginToken = store.loginToken;
    const connectToLogs = store.connectToLogs;
    const fetchSyncHistoryData = store.fetchSyncHistoryData;
    const connectToSyncHistoryData = store.connectToSyncHistoryData;

    const fetchBibleSyncData = store.fetchBibleSyncData;

    const navigate = useNavigate();

    useEffect(() => {
        if (loginToken) {
            connectToLogs();

            fetchSyncHistoryData()
                .catch((error) => {
                    console.error(error);

                    if (error.message === '401') {
                        navigate('/logout');
                    }
                })
                .finally(() => {
                    connectToSyncHistoryData().catch((error) => {
                        console.error(error);
                    });
                });

            fetchBibleSyncData();
        }
    }, [loginToken, connectToLogs, fetchSyncHistoryData, connectToSyncHistoryData, fetchBibleSyncData]);

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
    );
}

export default MainLayout;