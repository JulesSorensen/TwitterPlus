import accountsService from './accounts/accounts.service.js';

async function startServices(app, pool) {
    accountsService(app, pool);
}

export default startServices;