import launchError from "../error.js";
import { checkToken } from "./auth.service.js";

export default function tweetsService(app, pool) {
    app.get('/tweets', async (req, res) => {
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const page = (((req.query.page ?? 1) - 1) * 30);
        const conn = await pool.getConnection();
        let tweets = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, rewteeterId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.id LIMIT 30 OFFSET ?", [
            page
        ]);
        conn.end();
        const liked = await conn.query("SELECT tweetId FROM likes WHERE accountId = ?", [id]);
        const retweeted = await conn.query("SELECT tweetId FROM tweets WHERE authorId = ?", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE accountId = ?", [id]);

        tweets = tweets.map(tweet => {
            if (liked.some(like => like.tweetId === tweet.id)) tweet.liked = true;
            if (retweeted.some(retweet => retweet.tweetId === tweet.id)) tweet.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === tweet.id)) tweet.bookmarked = true;
            return tweet;
        })

        return res.json(tweets);
    })

    app.get('/tweets/:id', async (req, res) => {
        const { id: tweetId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const tweet = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, likes, commentsNb, retweetsNb, isRetweet, rewteeterId, createdAt, withComments FROM tweets t WHERE id = ? JOIN accounts a ON a.id = t.id", [
            tweetId
        ]);
        if (tweet.length === 0) return launchError(res, 404, 'Tweet not found');

        let responses = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, likes, commentsNb, retweetsNb, isRetweet, rewteeterId, createdAt, withComments FROM tweets t WHERE parentId = ? JOIN accounts a ON a.id = t.id", [
            tweetId
        ]);

        const liked = await conn.query("SELECT tweetId FROM likes WHERE accountId = ?", [id]);
        const retweeted = await conn.query("SELECT tweetId FROM tweets WHERE authorId = ?", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE accountId = ?", [id]);
        conn.end();

        if (liked.some(like => like.tweetId === tweet[0].id)) tweet[0].liked = true;
        if (retweeted.some(retweet => retweet.tweetId === tweet[0].id)) tweet[0].retweeted = true;
        if (bookmarked.some(bookmark => bookmark.tweetId === tweet[0].id)) tweet[0].bookmarked = true;

        responses = responses.map(response => {
            if (liked.some(like => like.tweetId === response.id)) response.liked = true;
            if (retweeted.some(retweet => retweet.tweetId === response.id)) response.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === response.id)) response.bookmarked = true;
            return response;
        })

        return res.json({ original: tweet[0], responses: responses });
    })

    app.get('/myTweets', async (req, res) => {
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const page = (((req.query.page ?? 1) - 1) * 30);
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id, authorId, parentId, content, likes, commentsNb, retweetsNb, isRetweet, rewteeterId, createdAt, withComments FROM tweets WHERE authorId = ? LIMIT 30 OFFSET ?", [
            id,
            page
        ]);
        conn.end();

        return res.json(rows);
    })


    app.post('/tweets', async (req, res) => {
        const { content, parentId, isRetweet, retweeterId, withComment } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const rows = await conn.query("INSERT INTO tweets SET (authorId, parentId, content, isRetweet, retweeterId, withComment) VALUES (?, ?, ?, ?, ?, ?)", [
            id,
            parentId,
            content,
            isRetweet ?? false,
            retweeterId ?? null,
            withComment ?? false
        ]);
        conn.end();

        if (rows.length === 0) return launchError(res, 404, 'Account not found');
        return res.json(rows[0]);
    })

    app.delete('/tweets/:id', async (req, res) => {
        const { id: tweetId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM tweets WHERE id = ?" [
            id
        ]);

        if (rows.length === 0) return launchError(res, 404, 'Tweet not found', conn);

        await conn.query("DELETE FROM tweets WHERE id = ?", [
            id
        ]);
        conn.end();

        if (rows.length === 0) return launchError(res, 404, 'Account not found');
        return res.json(rows[0]);
    })
}