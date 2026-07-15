// Syncer.tsx
import './Syncer.module.css';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table';
import useStore from "../store";
import { BibleDataRow } from "../Types/BibleDataRow";
import { SyncHistoryRow } from "../Types/SyncHistoryRow";

function formatDateTime(value?: Date | string | null) {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleString();
}

function shortenBibleName(name: string) {
    if (!name || name.length <= 30) {
        return name;
    }

    return `${name.slice(0, 30)}...`;
}

function Spinner({ label }: { label: string }) {
    return (
        <div className="spinner-border spinner-border-sm text-secondary syncerSpinner" role="status">
            <span className="visually-hidden">{label}</span>
        </div>
    );
}

function Syncer() {
    const bibleTableData = useStore((state) => state.bibleTableData);
    const syncHistoryData = useStore((state) => state.syncHistoryData);
    const bibleSyncStatuses = useStore((state) => state.bibleSyncStatuses);
    const waitingForSync = useStore((state) => state.waitingForSync);
    const waitingForCancel = useStore((state) => state.waitingForCancel);
    const queueBibleSync = useStore((state) => state.queueBibleSync);
    const cancelBibleSync = useStore((state) => state.cancelBibleSync);

    const handleActiveSwitchChange = (row: BibleDataRow, active: boolean) => {
        // updateBibleTableData(row.name, { active });
        console.log(row, active);
    };

    const handleQueueSync = (bibleId: string) => {
        queueBibleSync(bibleId).catch((error) => {
            console.error(error);
        });
    };

    const handleCancelSync = (row: BibleDataRow) => {
        cancelBibleSync(row.id, row.name).catch((error) => {
            console.error(error);
        });
    };

    const renderSyncControl = (row: BibleDataRow) => {
        const syncStatus = bibleSyncStatuses[row.id] || { state: 'idle' };
        const isWaitingForCancel = waitingForCancel.includes(row.id);
        const isWaitingForSync = waitingForSync.includes(row.id);

        const cancelControl = isWaitingForCancel
            ? <Spinner label="Cancelling..." />
            : (
                <button
                    className="btn btn-sm btn-outline-danger syncerCancelButton"
                    onClick={() => handleCancelSync(row)}
                >
                    Cancel
                </button>
            );

        if (syncStatus.state === 'queued') {
            return (
                <div className="syncerSyncControl">
                    <span title="Queued" className="syncerQueuedIcon text-secondary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            className="bi bi-hourglass"
                            viewBox="0 0 16 16"
                        >
                            <path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1-.5-.5m2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256 1.011.791 1.011 1.491v.702c0 .7-.478 1.235-1.011 1.491A3.5 3.5 0 0 0 4.5 13v1h7v-1a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351v-.702c0-.7.478-1.235 1.011-1.491A3.5 3.5 0 0 0 11.5 3V2z" />
                        </svg>
                    </span>
                    {cancelControl}
                </div>
            );
        }

        if (syncStatus.state === 'syncing') {
            return (
                <div className="syncerSyncControl">
                    <div
                        className="progress syncerProgress"
                        role="progressbar"
                        aria-label={`Syncing ${row.name}`}
                        aria-valuenow={syncStatus.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        title={`${syncStatus.percentage}%`}
                    >
                        <div
                            className="progress-bar"
                            style={{ width: `${syncStatus.percentage}%` }}
                        >
                            {syncStatus.percentage}%
                        </div>
                    </div>
                    {cancelControl}
                </div>
            );
        }

        if (isWaitingForSync) {
            return (
                <div className="syncerSyncControl">
                    <Spinner label="Queuing..." />
                </div>
            );
        }

        return (
            <button
                className="btn btn-sm btn-secondary syncerSyncButton"
                onClick={() => handleQueueSync(row.id)}
            >
                Sync
            </button>
        );
    };

    const bibleColumnHelper = createColumnHelper<BibleDataRow>();
    const historyColumnHelper = createColumnHelper<SyncHistoryRow>();

    const bibleColumns = [
        bibleColumnHelper.accessor('id', {
            header: () => <span>Id</span>,
            cell: (info) => info.getValue(),
        }),
        bibleColumnHelper.accessor('abbreviation', {
            header: () => <span>Abbr.</span>,
            cell: (info) => info.getValue(),
        }),
        bibleColumnHelper.accessor('name', {
            header: () => <span>Name</span>,
            cell: (info) => {
                const name = info.getValue();

                return (
                    <span title={name}>
                        {shortenBibleName(name)}
                    </span>
                );
            },
        }),
        bibleColumnHelper.accessor('sync', {
            header: () => <span>Sync</span>,
            cell: (info) => renderSyncControl(info.row.original),
        }),
        bibleColumnHelper.accessor('lastSync', {
            header: () => <span>Last Sync</span>,
            cell: (info) => formatDateTime(info.getValue()),
        }),
        bibleColumnHelper.accessor('nextScheduledSync', {
            header: () => <span>Next Scheduled</span>,
            cell: (info) => formatDateTime(info.getValue()),
        }),
        bibleColumnHelper.accessor('active', {
            header: () => <span>Active</span>,
            cell: (info) => {
                const row = info.row.original;
                const switchId = `active-switch-${row.id}`;

                return (
                    <div className="form-check form-switch m-0">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id={switchId}
                            checked={info.getValue()}
                            onChange={(event) => handleActiveSwitchChange(row, event.target.checked)}
                        />
                    </div>
                );
            },
        }),
    ];

    const historyColumns = [
        historyColumnHelper.accessor('timestamp', {
            header: () => <span>Timestamp</span>,
            cell: (info) => formatDateTime(info.getValue()),
        }),
        historyColumnHelper.accessor('bible', {
            header: () => <span>Bible</span>,
            cell: (info) => {
                const bible = info.getValue();

                return (
                    <span title={bible}>
                        {shortenBibleName(bible)}
                    </span>
                );
            },
        }),
        historyColumnHelper.accessor('initiator', {
            header: () => <span>Initiator</span>,
            cell: (info) => info.getValue(),
        }),
        historyColumnHelper.accessor('action', {
            header: () => <span>Action</span>,
            cell: (info) => info.getValue(),
        }),
        historyColumnHelper.accessor('error', {
            header: () => <span>Error</span>,
            cell: (info) => info.getValue() || '',
        }),
    ];

    const bibleTable = useReactTable({
        data: bibleTableData,
        columns: bibleColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    });

    const historyTable = useReactTable({
        data: syncHistoryData,
        columns: historyColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="syncerPage bg-body text-body">
            <section className="syncerPanel syncerPanelBibles bg-body border">
                <div className="syncerPanelHeader bg-body-tertiary border-bottom">
                    <h3 className="text-body">Bibles</h3>
                </div>

                <div className="syncerTableWrap">
                    <table className="table table-sm table-bordered table-hover syncerTable syncerBibleTable mb-0">
                        <thead>
                        {bibleTable.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody>
                        {bibleTable.getRowModel().rows.length === 0 && (
                            <tr>
                                <td colSpan={bibleColumns.length} className="text-body-secondary text-center py-3">
                                    <Spinner label="No Bibles Loaded"/>
                                </td>
                            </tr>
                        )}

                        {bibleTable.getRowModel().rows.map((row) => (
                            <tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="syncerPagination bg-body-tertiary border-top">
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => bibleTable.previousPage()}
                        disabled={!bibleTable.getCanPreviousPage()}
                    >
                        Previous
                    </button>

                    <span className="text-body-secondary">
                        Page {bibleTable.getState().pagination.pageIndex + 1} of {bibleTable.getPageCount()}
                    </span>

                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => bibleTable.nextPage()}
                        disabled={!bibleTable.getCanNextPage()}
                    >
                        Next
                    </button>
                </div>
            </section>

            <section className="syncerPanel syncerPanelHistory bg-body border">
                <div className="syncerPanelHeader bg-body-tertiary border-bottom">
                    <h3 className="text-body">Sync Logs</h3>
                </div>

                <div className="syncerTableWrap logs-table-wrap">
                    <table className="table table-sm table-bordered table-hover syncerTable logs-table mb-0">
                        <thead>
                        {historyTable.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                        </thead>
                        <tbody>
                        {historyTable.getRowModel().rows.length === 0 && (
                            <tr>
                                <td colSpan={historyColumns.length} className="text-body-secondary text-center py-3">
                                    No history logs received.
                                </td>
                            </tr>
                        )}

                        {historyTable.getRowModel().rows.map((row) => (
                            <tr key={row.original.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className={cell.column.id === 'message' || cell.column.id === 'error'
                                            ? 'logs-message'
                                            : 'logs-nowrap'}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default Syncer;