import { checkToken } from "./auth.service.js";
import launchError from "../error.js";

export default function bookmarksService(app, pool) {
    app.get('/bookmarks', async (req, res) => {
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const rows = (await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [
            id
        ])).map(row => row.tweetId);
        conn.end();

        return res.json(rows);
    })

    app.post('/bookmarks', async (req, res) => {
        const { tweetId } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const originalTweet = await conn.query("SELECT id FROM tweets WHERE id = ?", [
            tweetId
        ]);
        if (originalTweet.length === 0) return launchError(res, 404, 'Tweet not found', conn);

        const bm = await conn.query("SELECT * FROM bookmarks WHERE userId = ? and tweetId = ?", [
            id,
            tweetId
        ]);
        if (bm.length !== 0) return launchError(res, 404, 'You already bookmarked this tweet', conn);

        await conn.query("INSERT INTO bookmarks (tweetId, userId) VALUES (?, ?)", [
            tweetId,
            id
        ]);

        conn.end();

        return res.json({ success: true });
    })

    app.delete('/bookmarks', async (req, res) => {
        const { tweetId } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const originalTweet = await conn.query("SELECT id FROM tweets WHERE id = ?", [
            tweetId
        ]);
        if (originalTweet.length === 0) return launchError(res, 404, 'Tweet not found', conn);

        const bm = await conn.query("SELECT * FROM bookmarks WHERE userId = ? and tweetId = ?", [
            id,
            tweetId
        ]);
        if (bm.length === 0) return launchError(res, 404, 'You haven\'t bookmarked this tweet', conn);

        await conn.query("DELETE FROM bookmarks WHERE tweetId = ? AND userId = ?", [
            tweetId,
            id
        ]);

        conn.end();

        return res.json({ success: true });
    })
}