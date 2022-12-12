import launchError from "../error.js";
import { checkToken } from "./auth.service.js";

export default function retweetsService(app, pool) {
    app.post('/retweets', async (req, res) => {
        const { retweetOfId } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const originalTweet = (await conn.query("SELECT * FROM tweets WHERE id = ?", [retweetOfId]))?.[0];
        if (!originalTweet) return launchError(res, 404, 'Tweet not found');

        await conn.query("INSERT INTO tweets (authorId, isRetweet, retweeterId, retweetOfId, withComments) VALUES (?, ?, ?, ?, ?)", [
            originalTweet.authorId,
            true,
            id,
            retweetOfId,
            false
        ]);

        let newRtNb = originalTweet.retweetsNb + 1;
        await conn.query("UPDATE tweets SET retweetsNb = ? WHERE id = ?", [
            newRtNb,
            retweetOfId
        ]);
        conn.end();

        return res.json({ error: false, message: 'Tweet created' });
    })

    app.delete('/retweets/:id', async (req, res) => {
        const { id: tweetId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const retweetTweet = await conn.query("SELECT id, retweetOfId FROM tweets WHERE retweetOfId = ? AND retweeterId = ? AND isRetweet = TRUE", [
            tweetId,
            id
        ]);
        if (retweetTweet.length === 0) return launchError(res, 404, 'Tweet not found', conn);

        if (retweetTweet[0].retweetOfId) {
            const parentTweet = (await conn.query("SELECT id, retweetsNb FROM tweets WHERE id = ?", [retweetTweet[0].retweetOfId]))?.[0];
            if (!parentTweet) return launchError(res, 404, 'Tweet not found', conn);

            const newRTNb = parseInt(parentTweet.retweetsNb) - 1;
            await conn.query("UPDATE tweets SET retweetsNb = ? WHERE id = ?", [
                newRTNb,
                parentTweet.id
            ]);
        }

        await conn.query("DELETE FROM tweets WHERE id = ?", [
            retweetTweet[0].id
        ]);
        conn.end();

        if (retweetTweet.length === 0) return launchError(res, 404, 'Account not found');
        return res.json(retweetTweet[0]);
    })
}