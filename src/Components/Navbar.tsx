import { NavLink } from 'react-router';
import useStore from "../store";

function Navbar() {
    const store = useStore();
    const admin = store.admin;

    return (
        <div className="d-flex flex-column flex-shrink-0 p-3 text-bg-dark bg-body-tertiary w-[320px]">
            <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                <span className="fs-4">Admins</span>
            </a>
            <hr/>
            <ul className="nav nav-pills flex-column mb-auto">
                <li className="nav-item">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `nav-link d-flex align-items-center${isActive ? ' active' : ''}`
                        }
                        aria-current="page"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-book me-2"
                            viewBox="0 0 16 16"
                        >
                            <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/>
                        </svg>
                        Syncer
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink
                        to="/logs"
                        className={({ isActive }) =>
                            `nav-link d-flex align-items-center${isActive ? ' active' : ''}`
                        }
                        aria-current="page"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                             className="bi bi-info-square me-2" viewBox="0 0 16 16">
                            <path
                                d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
                            <path
                                d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                        </svg>
                        Logs
                    </NavLink>
                </li>
            </ul>
            <hr/>
            <div className="dropdown">
                <a href="#"
                   className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
                   data-bs-toggle="dropdown" aria-expanded="false">
                    {admin?.username || ''}
                </a>
                <ul className="dropdown-menu dropdown-menu-dark text-small shadow">
                    <li><a className="dropdown-item" href="#">Settings</a></li>
                    <li>
                        <hr className="dropdown-divider"/>
                    </li>
                    <li><a className="dropdown-item" href="/logout">Sign out</a></li>
                </ul>
            </div>
        </div>
    );
}
export default Navbar;