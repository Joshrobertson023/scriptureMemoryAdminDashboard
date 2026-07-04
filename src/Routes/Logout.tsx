import {Navigate, useNavigate} from "react-router";
import useStore from "../store";
import {useEffect} from "react";

function Logout() {
    const store = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        store.logout();
        navigate('/login');
    }, []);

    return (
        <>
            <p>Logging out...</p>
        </>
    )
}

export default Logout