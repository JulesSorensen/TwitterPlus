export default function accountsService(app, pool) {
    app.get('/accounts', async (req, res) => {
        const name = req.query.name?.toLowerCase();
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id, name, email, picture, background, certification, createdAt FROM accounts WHERE name = ?", [name]);
        conn.end();

        if (rows.length === 0) {
            return res.status(404).send({ error: true, message: 'Account not found' });
        }
        return res.json(rows[0]);
    })

    app.post('/accounts', async (req, res) => {
        const account = req.body;
        const conn = await pool.getConnection();
        const queryRes = await conn.query("INSERT INTO accounts (name, email, password, picture, background, certification, disabled, createdAt) value (?, ?, ?, ?, ?, ?, ?, ?)", [
            account.name ?? null,
            account.email ?? null,
            account.password ?? null,
            account.picture ?? null,
            account.background ?? null,
            account.certification ?? 0,
            0,
            +new Date()
        ]);
        console.log(queryRes);
        res.end();
    })
}