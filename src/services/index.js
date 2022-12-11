import accountsService from './accounts.service.js';
import authService from './auth.service.js';
import tweetsService from './tweets.service.js';
import likesService from './likes.service.js';
import bookmarksService from './bookmarks.service.js';
import surbscribeService from './subscribe.service.js';

async function startServices(app, pool) {
    accountsService(app, pool);
    authService(app, pool);
    tweetsService(app, pool);
    likesService(app, pool);
    bookmarksService(app, pool);
    surbscribeService(app, pool);
}

export default startServices;