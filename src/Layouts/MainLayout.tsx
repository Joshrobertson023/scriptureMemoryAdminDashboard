import {Navigate, Outlet} from "react-router";
import useStore from "../store";
import Navbar from "../Components/Navbar";

function MainLayout() {
    const store = useStore();
    const loginToken = store.loginToken;

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