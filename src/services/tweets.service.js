import launchError from "../error.js";
import { checkToken } from "./auth.service.js";

export default function tweetsService(app, pool) {
    app.get('/tweets', async (req, res) => {
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');

        const conn = await pool.getConnection();
        let tweets = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE parentId IS NULL ORDER BY t.createdAt DESC");
        const liked = await conn.query("SELECT tweetId FROM likes WHERE userId = ?", [id]);
        const retweeted = await conn.query("SELECT retweetOfId FROM tweets WHERE authorId = ? AND isRetweet = TRUE", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [id]);

        tweets = await Promise.all(tweets.map(async tweet => {
            if (tweet.authorId === id && !tweet.isRetweet) tweet.self = true;
            if (liked.some(like => like.tweetId === tweet.id)) tweet.liked = true;
            if (retweeted.some(retweet => retweet.retweetOfId === tweet.id)) tweet.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === tweet.id)) tweet.bookmarked = true;
            if (tweet.isRetweet) {
                const account = await conn.query("SELECT id, name FROM accounts WHERE id = ?", [tweet.authorId]);
                const originalTweet = await conn.query("SELECT id, authorId, content, createdAt FROM tweets WHERE id = ?", [tweet.retweetOfId]);
                const originalAuthor = await conn.query("SELECT name, picture, certification FROM accounts WHERE id = ?", [originalTweet[0].authorId]);

                tweet = {
                    ...tweet,
                    ...originalTweet[0],
                    name: originalAuthor[0].name,
                    picture: originalAuthor[0].picture,
                    certification: originalAuthor[0].certification,
                    isRetweet: true,
                    retweeterName: account[0].name,
                    retweeterSelf: account[0].id === id,
                    retweetCreatedAt: tweet.createdAt
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
        const tweet = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE t.id = ?", [
            tweetId
        ]);
        if (tweet.length === 0) return launchError(res, 404, 'Tweet not found');

        let responses = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE parentId = ? ORDER BY t.createdAt DESC", [
            tweetId
        ]);

        const liked = await conn.query("SELECT tweetId FROM likes WHERE userId = ?", [id]);
        const retweeted = await conn.query("SELECT retweetOfId FROM tweets WHERE authorId = ? AND isRetweet = TRUE", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [id]);
        conn.end();

        if (tweet.authorId === id && !tweet.isRetweet) tweet[0].self = true;
        if (liked.some(like => like.tweetId === tweet[0].id)) tweet[0].liked = true;
        if (retweeted.some(retweet => retweet.retweetOfId === tweet[0].id)) tweet[0].retweeted = true;
        if (bookmarked.some(bookmark => bookmark.tweetId === tweet[0].id)) tweet[0].bookmarked = true;

        responses = responses.map(response => {
            if (response.authorId === id) response.self = true;
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

        const conn = await pool.getConnection();
        let tweets = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE authorId = ? AND parentId IS NULL ORDER BY t.createdAt DESC", [
            authorId
        ]);

        const liked = await conn.query("SELECT tweetId FROM likes WHERE userId = ?", [id]);
        const retweeted = await conn.query("SELECT retweetOfId FROM tweets WHERE authorId = ? AND isRetweet = TRUE", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [id]);

        tweets = await Promise.all(tweets.map(async tweet => {
            if (tweet.authorId === id && !tweet.isRetweet) tweet.self = true;
            if (liked.some(like => like.tweetId === tweet.id)) tweet.liked = true;
            if (retweeted.some(retweet => retweet.retweetOfId === tweet.id)) tweet.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === tweet.id)) tweet.bookmarked = true;
            if (tweet.isRetweet) {
                const account = await conn.query("SELECT name FROM accounts WHERE id = ?", [tweet.authorId]);
                const originalTweet = await conn.query("SELECT authorId, content, createdAt FROM tweets WHERE id = ?", [tweet.retweetOfId]);
                const originalAuthor = await conn.query("SELECT name, picture, certification FROM accounts WHERE id = ?", [originalTweet[0].authorId]);

                tweet = {
                    ...tweet,
                    ...originalTweet[0],
                    name: originalAuthor[0].name,
                    picture: originalAuthor[0].picture,
                    certification: originalAuthor[0].certification,
                    isRetweet: true,
                    retweeterName: account[0].name,
                    retweeterSelf: account[0].id === id,
                    retweetCreatedAt: tweet.createdAt
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

        const subscribedIds = (await pool.query("SELECT subscribedToId FROM subscribers WHERE userId = ?", [id])).map(sub => sub.subscribedToId);
        subscribedIds.push(id);

        const conn = await pool.getConnection();
        let tweets = await conn.query("SELECT t.id, a.name, a.picture, a.certification, authorId, parentId, content, t.likes, commentsNb, retweetsNb, isRetweet, retweetOfId, t.createdAt, withComments FROM tweets t JOIN accounts a ON a.id = t.authorId WHERE parentId IS NULL AND t.authorId IN (?) ORDER BY t.createdAt DESC", [
            subscribedIds
        ]);
        const liked = await conn.query("SELECT tweetId FROM likes WHERE userId = ?", [id]);
        const retweeted = await conn.query("SELECT retweetOfId FROM tweets WHERE authorId = ? AND isRetweet = TRUE", [id]);
        const bookmarked = await conn.query("SELECT tweetId FROM bookmarks WHERE userId = ?", [id]);

        tweets = await Promise.all(tweets.map(async tweet => {
            if (tweet.authorId === id && !tweet.isRetweet) tweet.self = true;
            if (liked.some(like => like.tweetId === tweet.id)) tweet.liked = true;
            if (retweeted.some(retweet => retweet.retweetOfId === tweet.id)) tweet.retweeted = true;
            if (bookmarked.some(bookmark => bookmark.tweetId === tweet.id)) tweet.bookmarked = true;
            if (tweet.isRetweet) {
                const account = await conn.query("SELECT name FROM accounts WHERE id = ?", [tweet.authorId]);
                const originalTweet = await conn.query("SELECT authorId, content, createdAt FROM tweets WHERE id = ?", [tweet.retweetOfId]);
                const originalAuthor = await conn.query("SELECT name, picture, certification FROM accounts WHERE id = ?", [originalTweet[0].authorId]);

                tweet = {
                    ...originalTweet[0],
                    name: originalAuthor[0].name,
                    picture: originalAuthor[0].picture,
                    isRetweet: true,
                    retweeterName: account[0].name,
                    retweeterSelf: account[0].id === id,
                    retweetCreatedAt: tweet.createdAt
                }
            }
            return tweet;
        }))
        conn.end();

        return res.json(tweets);
    })

    app.post('/tweets', async (req, res) => {
        const { content, parentId, withComments } = req.body;
        const { id, error } = await checkToken(req, pool);
        if (error) return launchError(res, 401, 'Invalid token');
        if (!content) return launchError(res, 400, 'Content is required');
        if (content.length > 300) return launchError(res, 400, 'Content is too long');

        const conn = await pool.getConnection();
        if (parentId) {
            const parentTweet = (await conn.query("SELECT id, isRetweet, withComments, commentsNb FROM tweets WHERE id = ?", [parentId]))?.[0];
            if (!parentTweet) return launchError(res, 404, 'Tweet not found');
            if (parentTweet.isRetweet) return launchError(res, 400, 'You can\'t comment a retweet');
            if (!parentTweet.withComments) return launchError(res, 400, 'Comments are disabled for this tweet');

            await conn.query("INSERT INTO tweets (authorId, parentId, content, withComments) VALUES (?, ?, ?, ?)", [
                id,
                parentId,
                content.replace(/\s+/g, ' ').trim(),
                withComments
            ]);

            let newCmNb = parentTweet.commentsNb + 1;
            await conn.query("UPDATE tweets SET commentsNb = ? WHERE id = ?", [
                newCmNb,
                parentId
            ]);
        } else {
            if (!content) return launchError(res, 400, 'Content is required');
            await conn.query("INSERT INTO tweets (authorId, content, withComments) VALUES (?, ?, ?)", [
                id,
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
        const rows = await conn.query("SELECT id, authorId, parentId FROM tweets WHERE id = ? AND isRetweet = FALSE", [
            tweetId
        ]);
        if (rows.length === 0) return launchError(res, 404, 'Tweet not found', conn);
        if (rows[0].authorId !== id) return launchError(res, 403, 'You can\'t delete this tweet', conn);

        if (rows[0].parentId) {
            const parentTweet = (await conn.query("SELECT commentsNb FROM tweets WHERE id = ?", [rows[0].parentId]))?.[0];
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

        let childsToDelete = [tweetId];
        do {
            const tweetToDeletes = await conn.query("SELECT id FROM tweets WHERE parentId IN (?)", [childsToDelete]);
            childsToDelete = tweetToDeletes.map(tweet => tweet.id);
            if (childsToDelete.length > 0) {
                await conn.query("DELETE FROM likes WHERE tweetId IN (?)", [childsToDelete]);
                await conn.query("DELETE FROM bookmarks WHERE tweetId IN (?)", [childsToDelete]);
                await conn.query("DELETE FROM tweets WHERE id IN (?)", [childsToDelete]);
            }
        } while (childsToDelete.length > 0);
        conn.end();

        if (rows.length === 0) return launchError(res, 404, 'Account not found');
        return res.json({ error: false, message: 'Tweet deleted' });
    })
}