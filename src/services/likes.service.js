import launchError from "../error.js";
import { checkToken } from "./auth.service.js";

export default function likesService(app, pool) {
    app.post('/like', async (req, res) => {
        const { tweetId } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const originalTweet = await conn.query("SELECT id, likes FROM tweets WHERE id = ?", [
            tweetId
        ]);
        if (originalTweet.length === 0) return launchError(res, 404, 'Tweet not found', conn);

        const like = await conn.query("SELECT * FROM likes WHERE userId = ? and tweetId = ?", [
            id,
            tweetId
        ]);
        if (like.length !== 0) return launchError(res, 404, 'You already liked this tweet', conn);

        const likes = originalTweet[0].likes + 1;

        await conn.query("INSERT INTO likes (tweetId, userId) VALUES (?, ?)", [
            tweetId,
            id
        ]);
        await conn.query("UPDATE tweets SET likes = ? WHERE id = ?", [
            likes,
            tweetId
        ]);

        conn.end();

        return res.json({ success: true });
    })

    app.delete('/like', async (req, res) => {
        const { tweetId } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const originalTweet = await conn.query("SELECT id, likes FROM tweets WHERE id = ?", [
            tweetId
        ]);
        if (originalTweet.length === 0) return launchError(res, 404, 'Tweet not found', conn);

        const like = await conn.query("SELECT * FROM likes WHERE userId = ? and tweetId = ?", [
            id,
            tweetId
        ]);
        if (like.length === 0) return launchError(res, 404, 'You didn\'t like this tweet', conn);

        const likes = originalTweet[0].likes - 1;

        await conn.query("DELETE FROM likes WHERE tweetId = ? AND userId = ?", [
            tweetId,
            id
        ]);
        await conn.query("UPDATE tweets SET likes = ? WHERE id = ?", [
            likes,
            tweetId
        ]);

        conn.end();

        return res.json({ success: true });
    })
}