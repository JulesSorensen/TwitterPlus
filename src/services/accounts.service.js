import { checkToken } from "./auth.service.js";
import launchError from "../error.js";
import sha1 from 'sha1';

export default function accountsService(app, pool) {
    app.get('/nameAvailability', async (req, res) => {
        const name = req.query.name?.toLowerCase();
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM accounts WHERE name = ?", [name]);
        conn.end();

        if (rows.length === 0) return res.status(404).send({ error: true, message: 'Account not found' });
        return res.json({ error: false, message: 'Account found' });
    })

    app.get('/accounts/:name?', async (req, res) => {
        const { name } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');
        const conn = await pool.getConnection();
        let rows;

        if (!name) {
            rows = await conn.query("SELECT id, name, picture, background, likes, subscribedNb, subscribersNb, certification FROM accounts WHERE id = ?", [id]);
            rows[0].self = true;
        } else {
            rows = await conn.query("SELECT id, name, picture, background, likes, subscribedNb, subscribersNb, certification FROM accounts WHERE name = ?", [name]);
            if (rows[0]?.id === id) rows[0].self = true;
        }
        conn.end();

        if (rows.length === 0) return res.status(404).send({ error: true, message: 'Account not found' });
        return res.json(rows[0]);
    })

    app.get('/findAccounts', async (req, res) => {
        const { name } = req.query;
        const conn = await pool.getConnection();
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const rows = await conn.query("SELECT name, picture, background, certification FROM accounts WHERE name LIKE ? LIMIT 3", [`%${name}%`]);
        conn.end();

        if (rows.length === 0) return res.status(404).send({ error: true, message: 'Account not found' });
        return res.json(rows);
    })

    app.get('/accountRecommandation', async (req, res) => {
        const conn = await pool.getConnection();
        const { error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        let accounts = await conn.query("SELECT name, picture, background, certification FROM accounts ORDER BY RAND() LIMIT 3");
        conn.end();
        const subcribedTo = await conn.query("SELECT subscribedTo FROM subscriptions WHERE subscriber = ?", [id]);
        accounts = accounts.map(account => {
            if (subcribedTo.some(sub => sub.subscribedTo === account.id)) return { ...account, subscribed: true };
            return account;
        })

        return res.json(accounts);
    })

    app.post('/accounts', async (req, res) => {
        let account = req.body;

        if (!account.name || !account.email || !account.password) return res.status(400).send({ error: true, message: 'Missing required fields' });
        account.name = account.name.replace(/\s+/g, '').trim();
        const conn = await pool.getConnection();

        const existingAccount = await conn.query("SELECT id FROM accounts WHERE name = ? OR email = ?", [account.name, account.email]);
        if (existingAccount.length > 0) return res.status(400).send({ error: true, message: 'Account already exists' });

        await conn.query("INSERT INTO accounts (name, email, password) value (?, ?, ?)", [
            account.name,
            account.email,
            sha1(account.password)
        ]);

        return res.json({ error: false, message: 'Account created' });
    })

    app.patch('/accounts', async (req, res) => {
        const { name, email, password, picture, background } = req.body;
        const conn = await pool.getConnection();
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const current = await conn.query("SELECT name, email, password, picture, background FROM accounts WHERE id = ?", [id]);
        await conn.query("UPDATE accounts SET name = ?, email = ?, password = ?, picture = ?, background = ? WHERE id = ?", [
            name ?? current[0].name,
            email ?? current[0].email,
            password ?? current[0].password,
            picture ?? current[0].picture,
            background ?? current[0].background,
            id
        ]);

        return res.json({ error: false, message: 'Account updated' });
    })

    app.delete('/accounts', async (req, res) => {
        const conn = await pool.getConnection();
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        await conn.query("DELETE FROM accounts WHERE id = ?", [id]);
        return res.json({ error: false, message: 'Account deleted' });
    })
}