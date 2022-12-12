import launchError from "../error.js";
import { checkToken } from "./auth.service.js";

export default function tweetsService(app, pool) {
    app.get('/tweets', async (req, res) => {
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const page = (((req.query.page ?? 1) - 1) * 30);
        const conn = await pool.getConnection();
        let tweets = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweeterId, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE parentId IS NULL ORDER BY t.createdAt DESC LIMIT 30 OFFSET ?", [
            page
        ]);
        const liked = await conn.query("SELECT tweetId FROM likes WHERE userId = ?", [id]);
        const retweeted = await conn.query("SELECT retweetOfId FROM tweets WHERE authorId = ? AND isRetweet = TRUE", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [id]);

        tweets = await Promise.all(tweets.map(async tweet => {
            if (liked.some(like => like.tweetId === tweet.id)) tweet.liked = true;
            if (retweeted.some(retweet => retweet.retweetOfId === tweet.id)) tweet.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === tweet.id)) tweet.bookmarked = true;
            if (tweet.isRetweet) {
                const account = await conn.query("SELECT name, picture, certification FROM accounts WHERE id = ?", [tweet.retweeterId]);
                const originalTweet = await conn.query("SELECT id, content, createdAt FROM tweets WHERE id = ?", [tweet.retweetOfId]);

                tweet = {
                    ...tweet,
                    id: originalTweet[0].id,
                    retweeterName: account[0].name,
                    content: originalTweet[0].content,
                    createdAt: originalTweet[0].createdAt,
                    retweetCreatedAt: tweet.createdAt,
                }
            }
            return tweet;
        }))
        conn.end();

        return res.json(tweets);
    })

    app.get('/tweets/:id', async (req, res) => {
        const { id: tweetId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const tweet = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweeterId, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE t.id = ?", [
            tweetId
        ]);
        if (tweet.length === 0) return launchError(res, 404, 'Tweet not found');

        let responses = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweeterId, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE parentId = ? ORDER BY t.createdAt DESC", [
            tweetId
        ]);

        const liked = await conn.query("SELECT tweetId FROM likes WHERE userId = ?", [id]);
        const retweeted = await conn.query("SELECT retweetOfId FROM tweets WHERE authorId = ? AND isRetweet = TRUE", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [id]);
        conn.end();

        if (liked.some(like => like.tweetId === tweet[0].id)) tweet[0].liked = true;
        if (retweeted.some(retweet => retweet.retweetOfId === tweet[0].id)) tweet[0].retweeted = true;
        if (bookmarked.some(bookmark => bookmark.tweetId === tweet[0].id)) tweet[0].bookmarked = true;

        responses = responses.map(response => {
            if (liked.some(like => like.tweetId === response.id)) response.liked = true;
            if (retweeted.some(retweet => retweet.retweetOfId === response.id)) response.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === response.id)) response.bookmarked = true;
            return response;
        })

        return res.json({ original: tweet[0], responses: responses });
    })

    app.get('/accoutsTweets/:id', async (req, res) => {
        const { id: authorId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const page = (((req.query.page ?? 1) - 1) * 30);
        const conn = await pool.getConnection();
        let tweets = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweeterId, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE authorId = ? AND parentId IS NULL ORDER BY t.createdAt DESC LIMIT 30 OFFSET ?", [
            authorId,
            page
        ]);
        const liked = await conn.query("SELECT tweetId FROM likes WHERE userId = ?", [id]);
        const retweeted = await conn.query("SELECT retweetOfId FROM tweets WHERE authorId = ? AND isRetweet = TRUE", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [id]);

        tweets = await Promise.all(tweets.map(async tweet => {
            if (liked.some(like => like.tweetId === tweet.id)) tweet.liked = true;
            if (retweeted.some(retweet => retweet.retweetOfId === tweet.id)) tweet.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === tweet.id)) tweet.bookmarked = true;
            if (tweet.isRetweet) {
                const account = await conn.query("SELECT name, picture, certification FROM accounts WHERE id = ?", [tweet.retweeterId]);
                const originalTweet = await conn.query("SELECT id, content, createdAt FROM tweets WHERE id = ?", [tweet.retweetOfId]);

                tweet = {
                    ...tweet,
                    id: originalTweet[0].id,
                    retweeterName: account[0].name,
                    content: originalTweet[0].content,
                    createdAt: originalTweet[0].createdAt,
                    retweetCreatedAt: tweet.createdAt,
                }
            }
            return tweet;
        }))
        conn.end();

        return res.json(tweets);
    })

    app.get('/myTweets', async (req, res) => {
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const page = (((req.query.page ?? 1) - 1) * 30);
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id, authorId, parentId, content, likes, commentsNb, retweetsNb, isRetweet, retweeterId, createdAt, withComments FROM tweets WHERE authorId = ? LIMIT 30 OFFSET ?", [
            id,
            page
        ]);
        conn.end();

        return res.json(rows);
    })

    app.post('/tweets', async (req, res) => {
        const { content, parentId, withComments } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');
        if (!content) return launchError(res, 400, 'Content is required');
        if (content.length > 300) return launchError(res, 400, 'Content is too long');

        console.log(content, parentId, withComments);
        const conn = await pool.getConnection();
        if (parentId) {
            const parentTweet = (await conn.query("SELECT * FROM tweets WHERE id = ?", [parentId]))?.[0];
            if (!parentTweet) return launchError(res, 404, 'Tweet not found');

            await conn.query("INSERT INTO tweets (authorId, parentId, content, withComments) VALUES (?, ?, ?, ?)", [
                id,
                parentId,
                content.replace(/\s+/g, ' ').trim(),
                parentTweet.withComments ?? false
            ]);

            let newCmNb = parentTweet.commentsNb + 1;
            await conn.query("UPDATE tweets SET commentsNb = ? WHERE id = ?", [
                newCmNb,
                parentId
            ]);
        } else {
            if (!content) return launchError(res, 400, 'Content is required');
            await conn.query("INSERT INTO tweets (authorId, parentId, content, withComments) VALUES (?, ?, ?, ?)", [
                isRetweet ? id : retweetOfId,
                parentId ?? null,
                content.replace(/\s+/g, ' ').trim(),
                withComments ?? false
            ]);
        }
        conn.end();

        return res.json({ error: false, message: 'Tweet created' });
    })

    app.delete('/tweets/:id', async (req, res) => {
        const { id: tweetId } = req.params;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT id FROM tweets WHERE id = ?"[
            id
        ]);
        if (rows.length === 0) return launchError(res, 404, 'Tweet not found', conn);

        if (rows[0].parentId) {
            const parentTweet = (await conn.query("SELECT * FROM tweets WHERE id = ?", [rows[0].parentId]))?.[0];
            if (!parentTweet) return launchError(res, 404, 'Tweet not found', conn);

            let newCmNb = parentTweet.commentsNb - 1;
            await conn.query("UPDATE tweets SET commentsNb = ? WHERE id = ?", [
                newCmNb,
                rows[0].parentId
            ]);

            await conn.query("DELETE FROM likes WHERE tweetId = ?", [tweetId]);
            await conn.query("DELETE FROM bookmarks WHERE tweetId = ?", [tweetId]);
        }

        await conn.query("DELETE FROM tweets WHERE id = ?", [
            tweetId
        ]);
        conn.end();

        if (rows.length === 0) return launchError(res, 404, 'Account not found');
        return res.json(rows[0]);
    })
}