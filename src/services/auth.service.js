export const checkToken = async (req, pool) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return { error: true, message: 'Missing token' };
    const conn = await pool.getConnection();
    const queryRes = await conn.query("SELECT id FROM accounts WHERE token = ?", [
        token
    ]);
    conn.end();

    if (queryRes.length === 0) return { error: true, message: 'Invalid token' };

    return { id: queryRes[0].id, error: false, message: 'Token is valid' };
}

export default function authService(app, pool) {
    app.post('/authenticate', async (req, res) => {
        const { name, email, password } = req.body;
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM accounts WHERE (name = ? or email = ?) and password = ?", [
            name ?? null,
            email ?? null,
            password
        ]);

        if (rows.length === 0) {
            return res.status(404).send({ error: true, message: 'Incorrect login or password' });
        }

        let newToken = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 100; i++) newToken += characters.charAt(Math.floor(Math.random() * characters.length));
        newToken += '.' + Math.floor(Date.now());

        await conn.query("UPDATE accounts SET token = ? WHERE id = ?", [
            newToken,
            rows[0].id
        ]);
        conn.end();

        return res.json({ id: rows[0].id, token: newToken });
    })

    app.get('/checkToken', async (req, res) => {
        const { id, error } = await checkToken(req, pool);
        if (error) return res.status(401).send({ error: true, message: 'Invalid token' });
        return res.json({ id, error: false, message: 'Token is valid' });
    })

    app.get('/logout', async (req, res) => {
        const token = req.headers?.authorization?.split(' ')?.[1];
        const conn = await pool.getConnection();
        await conn.query("UPDATE accounts SET token = null WHERE token = ?", [
            token
        ]);
        conn.end();

        res.end();
    })
}