import launchError from "../error.js";
import { checkToken } from "./auth.service.js";

export default function surbscribeService(app, pool) {
    app.get('/isSubscribed/:id', async (req, res) => {
        const { id: accountId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');
        
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM subscriptions WHERE userId = ? AND subscribedToId = ?", [
            id,
            accountId
        ]);
        conn.end();
        if (rows.length > 0) return res.json({ isSubscribed: true });
        return res.json({ isSubscribed: false });
    })

    app.post('/subscribe', async (req, res) => {
        const { id: accountToSubId } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM accounts WHERE id = ?", [
            accountToSubId
        ]);
        if (rows.length === 0) return launchError(res, 404, 'Account not found');

        await conn.query("INSERT INTO subscriptions (userId, subscribedToId) VALUES (?, ?)", [
            id,
            accountToSubId
        ]);
        conn.end();

        return res.json({ error: false, message: 'Subscribed' });
    })

    app.delete('/subscribe/:id', async (req, res) => {
        const { id: accountToUnsubId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM accounts WHERE id = ?", [
            accountToUnsubId
        ]);
        if (rows.length === 0) return launchError(res, 404, 'Account not found');

        await conn.query("DELETE FROM subscriptions WHERE userId = ? AND subscribedToId = ?", [
            id,
            accountToUnsubId
        ]);
        conn.end();

        return res.json({ error: false, message: 'Unsubscribed' });
    })
}