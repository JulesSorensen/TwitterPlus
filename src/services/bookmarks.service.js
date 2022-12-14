import { checkToken } from "./auth.service.js";
import launchError from "../error.js";

export default function bookmarksService(app, pool) {
    app.get('/bookmarks', async (req, res) => {
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const tweetIds = (await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [
            id
        ])).map(row => row.tweetId);
        conn.end();

        if (tweetIds.length === 0) return res.json([]);

        let tweets = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE t.id IN (?)", [tweetIds]);
        const liked = await conn.query("SELECT tweetId FROM likes WHERE userId = ?", [id]);
        const retweeted = await conn.query("SELECT retweetOfId FROM tweets WHERE authorId = ? AND isRetweet = TRUE", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [id]);

        tweets = await Promise.all(tweets.map(async tweet => {
            if (tweet.authorId === id && !tweet.isRetweet) tweet.self = true;
            if (liked.some(like => like.tweetId === tweet.id)) tweet.liked = true;
            if (retweeted.some(retweet => retweet.retweetOfId === tweet.id)) tweet.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === tweet.id)) tweet.bookmarked = true;
            return tweet;
        }))

        return res.json(tweets);
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