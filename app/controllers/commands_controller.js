'use strict';

const commandModel = require('../models/command');
const staticData = require('../models/staticData');
const config = require('../../config/config');
const { Extra, Markup } = require('telegraf');

/**
 * Reply ranked information.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.getRankedInformation = (ctx, next) => {

    // Parse arguments 
    parseArguments(ctx, 1);

    // If no arguments supplied, using the user's pre-defined name.
    const summonerName = ctx.args == '' ? (config.users[ctx.message.from.username]).summonerName : ctx.args[0];

    // If no arguments supplied, using the user's pre-defined region.
    const region = ctx.args == '' ? (config.users[ctx.message.from.username]).region.toUpperCase() : 'EUNE';

    // Get summoner ranked information.
    commandModel.getRankedInformation(summonerName, region)
        .then((result) => {
            // Reply with ranked information.
            ctx.reply(result.rankedInformationArray ? commandModel.parseRankedInformation(result.rankedInformationArray, summonerName) : result.message, { parse_mode: 'Markdown' });
        }).catch((result) => {
            // Reply with general error message.
            console.log(result.message);
            ctx.reply('Something went wrong :(');
        });
};

/**
 * Reply top mastery champions.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.getTopMasteryChampions = (ctx, next) => {

    // Parse arguments 
    parseArguments(ctx, 1);

    // If no arguments supplied, using the user's pre-defined name.
    const summonerName = ctx.args == '' ? (config.users[ctx.message.from.username]).summonerName : ctx.args[0];

    // If no arguments supplied, using the user's pre-defined region.
    const region = ctx.args == '' ? (config.users[ctx.message.from.username]).region.toUpperCase() : 'EUNE';

    // Get top mastery champions.
    commandModel.getTopMasteryChampions(summonerName, region)
        .then((result) => {
            // Reply with top mastery champions.
            ctx.reply(result.topMasteryChampionsArray ? commandModel.parseTopMasteryChampions(result.topMasteryChampionsArray, summonerName) : result.message, { parse_mode: 'Markdown' });
        }).catch((result) => {
            // Reply with general error message.
            console.log(result.message);
            ctx.reply('Something went wrong :(');
        });
};

/**
 * Reply recent game information.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.getRecentGameInformation = (ctx, next) => {

    // Parse arguments 
    parseArguments(ctx, 1);

    // If no arguments supplied, using the user's pre-defined name.
    const summonerName = ctx.args == '' ? (config.users[ctx.message.from.username]).summonerName : ctx.args[0];

    // If no arguments supplied, using the user's pre-defined region.
    const region = ctx.args == '' ? (config.users[ctx.message.from.username]).region.toUpperCase() : 'EUNE';

    // Get summoner ranked information.
    commandModel.getRecentGameInformation(summonerName, region)
        .then((result) => {
            ctx.reply(result.gameInformationObject ? commandModel.parseRecentGameInformation(result.gameInformationObject, summonerName) : result.message, { parse_mode: 'Markdown' });
        }).catch((result) => {
            console.log(result.message);
            ctx.reply('Something went wrong :(');
        });
};

/**
 * Reply game message.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.initiateGame = (ctx, next) => {

    // Parse arguments 
    parseArguments(ctx, 1);

    // If no arguments supplied, using a pre-defined message.
    let gameMessage = ctx.args == '' ? 'Looking for feeders for the rift!\n' : ctx.args[0] + '\n';

    // Going over the users, remove the sender and users configured not the get messages.
    for (let key in config.users) {
        if (config.users.hasOwnProperty(key)) {
            if (key != ctx.message.from.username && config.users[key].gameRequest)
                gameMessage += '@' + key + ' ';
        }
    }

    // Announce a game message.
    ctx.reply(gameMessage);
};

/**
 * Reply top N channels for League of Legends.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.getTopTwitchChannels = (ctx, next) => {

    commandModel.getTopTwitchChannels()
        .then((result) => {
            ctx.reply(result.streamInformationObject ? commandModel.parseTopTwitchChannels(result.streamInformationObject) : result.message, Extra.HTML().webPreview(false));
        })
        .catch((result) => {
            console.log(result.message);
            ctx.reply('Something went wrong :(');
        });
};

/**
 * Audit commands. Acts as a middleware.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.middlewareAuditCommands = (ctx, next) => {
    console.info('[%s] %s from %s on %s %s', new Date(ctx.message.date).toISOString(), ctx.message.text, ctx.message.from.username, ctx.message.chat.type, ctx.message.chat.title);
    next();
};

/**
 * Allows only config.users to use the bot. Acts as a middleware.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.middlewarePrivileges = (ctx, next) => {
    if (config.users[ctx.message.from.username])
        next();
};

/**
 * Injects arguments from command into context object by splitting num -1 spaces.
 * @param {Object} ctx context object.
 * @param {Number} num number of arguments wanted. 
 */
const parseArguments = (ctx, num) => {

    // Remove double spaces, split by space and remove the command itself.
    const str = ctx.message.text.replace(/  +/g, ' ');
    const arr = str.split(' ');
    let result = arr.splice(0, num);
    result.push(arr.join(' '));

    ctx.args = result.splice(1);
};