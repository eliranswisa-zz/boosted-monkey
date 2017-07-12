'use strict';

const config = require('../../config/config');
const Telegraf = require('telegraf');
const commandsControllers = require('../controllers/commands_controller');

const commands = (app, start) => {

    // Register bot username for group commands.
    app.telegram.getMe().then((botInfo) => {
        app.options.username = botInfo.username;
    })

    // Accept commands only when program is running.
    app.use((ctx, next) => {
        if (ctx.update.message.date > start)
            next()
    });

    // Audit commands.
    app.use(commandsControllers.middlewareAuditCommands);

    // Privileges.
    app.use(commandsControllers.middlewarePrivileges);

    // Ranked standings.
    app.command("ranked", commandsControllers.getRankedInformation);

    // Mastery information.
    app.command("mastery", commandsControllers.getTopMasteryChampions);

    // Game announcement.
    app.command("game", commandsControllers.initiateGame);

    // Recent game information.
    app.command("recent", commandsControllers.getRecentGameInformation);

    // Top League of Legends Twitch Channels
     app.command("twitch", commandsControllers.getTopTwitchChannels);

    // General error handling.
    app.catch((err) => {
        console.log('Ooops', err)
    });

};

module.exports = commands;