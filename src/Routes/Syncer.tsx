function Syncer() {
    const items = [
        { },
        { }
    ]

    return (
        <>
            <div className="me-5">
                <h4>Bibles</h4>
                <table className="table">
                    <thead>
                        <tr>
                            <th scope="col">Id</th>
                            <th scope="col">Name</th>
                            <th scope="col">Status</th>
                            <th scope="col">Last Sync</th>
                        </tr>
                    </thead>
                    <tbody>
                    {/*{items.map((i) => {*/}
                    {/*    <tr>*/}
                    {/*        <th scope="row">{i.id}</th>*/}
                    {/*    </tr>*/}
                    {/*})}*/}
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default Syncer