import useStore, {type SignalRLog} from "../store";
import "../App.css";

const warningLevels = ['warning', 'error', 'critical', 'none'];

function getLogDate(timestamp: string) {
    if (!timestamp) {
        return '';
    }

    return new Date(timestamp).toLocaleString();
}

function getWarningLogClass(level: string) {
    switch (level.toLowerCase()) {
        case 'warning':
            return 'table-warning';
        case 'error':
            return 'table-danger';
        case 'critical':
            return 'table-primary logs-row-critical';
        default:
            return 'table-secondary';
    }
}

function LogsTable({logs, colored}: { logs: SignalRLog[]; colored?: boolean }) {
    return (
        <div className="logs-table-wrap">
            <table className="table table-sm table-bordered table-hover logs-table mb-0">
                <thead>
                <tr>
                    <th className="logs-time-col">Timestamp</th>
                    <th className="logs-level-col">Level</th>
                    <th>Message</th>
                </tr>
                </thead>
                <tbody>
                {logs.length === 0 && (
                    <tr>
                        <td colSpan={3} className="text-body-secondary text-center py-3">
                            No logs received.
                        </td>
                    </tr>
                )}

                {logs.map((log, index) => (
                    <tr
                        key={`${log.timestamp}-${log.level}-${index}`}
                        className={colored ? getWarningLogClass(log.level) : undefined}
                    >
                        <td className="logs-nowrap">{getLogDate(log.timestamp)}</td>
                        <td className="logs-nowrap fw-semibold">{log.level}</td>
                        <td className="logs-message">{log.message}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function Logs() {
    const logs = useStore((state) => state.logs);

    const informationLogs = logs.filter((log) => log.level.toLowerCase() === 'information');
    const warningLogs = logs.filter((log) => warningLevels.includes(log.level.toLowerCase()));

    return (
        <div className="logs-page bg-body text-body">
            <div className="logs-grid">
                <section className="logs-panel bg-body border">
                    <div className="logs-panel-header bg-body-tertiary border-bottom">
                        <h2 className="text-body">Information</h2>
                        <span className="text-body-secondary">{informationLogs.length}</span>
                    </div>

                    <LogsTable logs={informationLogs} />
                </section>

                <section className="logs-panel bg-body border">
                    <div className="logs-panel-header bg-body-tertiary border-bottom">
                        <h2 className="text-body">Warning</h2>
                        <span className="text-body-secondary">{warningLogs.length}</span>
                    </div>

                    <LogsTable logs={warningLogs} colored />
                </section>
            </div>
        </div>
    )
}

export default Logs;