import launchError from "../error.js";
import { checkToken } from "./auth.service.js";

export default function surbscribeService(app, pool) {
    app.get('/isSubscribed/:id', async (req, res) => {
        const { id: accountId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM subscribers WHERE userId = ? AND subscribedToId = ?", [
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
        if (id === accountToSubId) return launchError(res, 400, 'You can\'t subscribe to yourself');

        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM accounts WHERE id = ?", [
            accountToSubId
        ]);
        if (rows.length === 0) return launchError(res, 404, 'Account not found');

        const isAlreadySubscribed = await conn.query("SELECT id FROM subscribers WHERE userId = ? AND subscribedToId = ?", [id, accountToSubId]);
        if (isAlreadySubscribed.length > 0) return launchError(res, 400, 'You are already subscribed to this account');

        await conn.query("INSERT INTO subscribers (userId, subscribedToId) VALUES (?, ?)", [
            id,
            accountToSubId
        ]);

        const account = await conn.query("SELECT subscribedNb FROM accounts WHERE id = ?", [id]);
        const accountSubs = account[0].subscribedNb + 1;
        await conn.query("UPDATE accounts SET subscribedNb = ? WHERE id = ?", [accountSubs, id]);

        const accountToSub = await conn.query("SELECT subscribersNb FROM accounts WHERE id = ?", [accountToSubId]);
        const accountToSubSubs = accountToSub[0].subscribersNb + 1;
        await conn.query("UPDATE accounts SET subscribersNb = ? WHERE id = ?", [accountToSubSubs, accountToSubId]);

        conn.end();

        return res.json({ error: false, message: 'Subscribed' });
    })

    app.delete('/subscribe/:id', async (req, res) => {
        const { id: accountToUnsubId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');
        if (id === accountToUnsubId) return launchError(res, 400, 'You can\'t unsubscribe from yourself');

        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM accounts WHERE id = ?", [
            accountToUnsubId
        ]);
        if (rows.length === 0) return launchError(res, 404, 'Account not found');

        const isAlreadySubscribed = await conn.query("SELECT id FROM subscribers WHERE userId = ? AND subscribedToId = ?", [id, accountToUnsubId]);
        if (isAlreadySubscribed.length === 0) return launchError(res, 400, 'You are not subscribed to this account');

        await conn.query("DELETE FROM subscribers WHERE userId = ? AND subscribedToId = ?", [
            id,
            accountToUnsubId
        ]);

        const account = await conn.query("SELECT subscribedNb FROM accounts WHERE id = ?", [id]);
        const accountSubs = account[0].subscribedNb - 1;
        await conn.query("UPDATE accounts SET subscribedNb = ? WHERE id = ?", [accountSubs, id]);

        const accountToSub = await conn.query("SELECT subscribersNb FROM accounts WHERE id = ?", [accountToUnsubId]);
        const accountToSubSubs = accountToSub[0].subscribersNb - 1;
        await conn.query("UPDATE accounts SET subscribersNb = ? WHERE id = ?", [accountToSubSubs, accountToUnsubId]);

        conn.end();

        return res.json({ error: false, message: 'Unsubscribed' });
    })
}