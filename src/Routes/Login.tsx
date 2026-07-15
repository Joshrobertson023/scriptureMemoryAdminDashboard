import {useState} from "react";
import useStore from "../store";
import {useNavigate} from "react-router";

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const store = useStore();
    const navigate = useNavigate();

    const login = async(e: any) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            await store.login(username.trim(), password.trim());
            navigate("/");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }

    }

    return (
        <div className="container min-vh-100 d-flex flex-column justify-content-center align-items-center text-center mt-[-50px]">
            <form onSubmit={(e) => login(e)} style={{ width: '100%', maxWidth: '400px' }}>
                <div className="alert alert-warning h-25 w-100 mb-5" role="alert" style={{visibility: error ? 'visible' : 'hidden', minHeight: '58px'}}>
                    {error}
                </div>
                <div className="mb-3 text-start">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input type="text" onChange={(e) => setUsername(e.target.value)} className="form-control" id="username" name="username" />
                </div>
                <div className="mb-3 text-start">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" onChange={(e) => setPassword(e.target.value)} className="form-control" id="password" name="password" />
                </div>
                {loading ? (
                    <button type="button" className="btn btn-primary w-100 mt-2" disabled>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    </button>
                ) : (
                    <button type="submit" className="btn btn-primary w-100 mt-2">Login</button>
                )}
            </form>
        </div>
    )
}

export default Login