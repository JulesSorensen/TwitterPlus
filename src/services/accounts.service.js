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
        let account;

        if (!name) {
            account = await conn.query("SELECT id, name, picture, background, likes, subscribedNb, subscribersNb, certification FROM accounts WHERE id = ?", [id]);
            account[0].self = true;
        } else {
            account = await conn.query("SELECT id, name, picture, background, likes, subscribedNb, subscribersNb, certification FROM accounts WHERE name = ?", [name]);
            if (account[0]?.id === id) account[0].self = true;
        }
        const subs = await conn.query("SELECT subscribedToId FROM subscribers WHERE userId = ?", [id]);
        conn.end();
        if (subs.some(sub => sub.subscribedToId === account[0].id)) account[0].subscribed = true;

        if (account.length === 0) return res.status(404).send({ error: true, message: 'Account not found' });
        return res.json(account[0]);
    })

    app.get('/findAccounts', async (req, res) => {
        const { name } = req.query;
        const conn = await pool.getConnection();
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const rows = await conn.query("SELECT name, picture, certification FROM accounts WHERE name LIKE ? LIMIT 3", [`%${name}%`]);
        conn.end();

        if (rows.length === 0) return res.status(404).send({ error: true, message: 'Account not found' });
        return res.json(rows);
    })

    app.get('/accountRecommandation', async (req, res) => {
        const conn = await pool.getConnection();
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        let accounts = await conn.query("SELECT id, name, picture, certification FROM accounts WHERE id != ? ORDER BY RAND() LIMIT 5", [id]);
        const subcribedTo = await conn.query("SELECT subscribedToId FROM subscribers WHERE userId = ?", [id]);
        conn.end();
        accounts = accounts.map(account => {
            account.subscribed = subcribedTo.some(sub => sub.subscribedToId === account.id);
            return account;
        });

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
        conn.end();

        return res.json({ error: false, message: 'Account created' });
    })

    app.patch('/accounts', async (req, res) => {
        const { name, email, picture, background, certification } = req.body;
        const conn = await pool.getConnection();
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const current = await conn.query("SELECT name, email, picture, background, certification FROM accounts WHERE id = ?", [id]);
        await conn.query("UPDATE accounts SET name = ?, email = ?, picture = ?, background = ?, certification = ? WHERE id = ?", [
            name ?? current[0].name,
            email ?? current[0].email,
            picture ?? current[0].picture,
            background ?? current[0].background,
            certification ?? current[0].certification,
            id
        ]);
        conn.end();

        return res.json({ error: false, message: 'Account updated' });
    })

    app.patch('/accounts/password', async (req, res) => {
        const { password, newPassword } = req.body;
        const conn = await pool.getConnection();
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const current = await conn.query("SELECT password FROM accounts WHERE id = ?", [id]);
        if (current[0].password !== sha1(password)) return launchError(res, 401, 'Invalid password');

        await conn.query("UPDATE accounts SET password = ? WHERE id = ?", [sha1(newPassword), id]);
        conn.end();

        return res.json({ error: false, message: 'Password updated' });
    })

    app.get('/leaderboard', async (req, res) => {
        const conn = await pool.getConnection();
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const accounts = await conn.query("SELECT name, picture, certification, subscribersNb, createdAt FROM accounts ORDER BY subscribersNb DESC LIMIT 3");
        conn.end();

        return res.json(accounts);
    })
}