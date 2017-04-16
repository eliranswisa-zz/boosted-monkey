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
    parseArguments(ctx, 2);

    if (!validateArguments(ctx)) {
        ctx.reply(ctx.userInfo.message);
        next();
    }
    else {
        // Get summoner ranked information.
        commandModel.getRankedInformation(ctx.userInfo.summonerName, ctx.userInfo.region)
            .then(function (result) {
                // Reply with ranked information.
                ctx.reply(result.rankedInformationArray ? commandModel.parseRankedInformation(result.rankedInformationArray, ctx.userInfo.summonerName) : result.message, { parse_mode: 'Markdown' });
            }).catch(function (result) {
                // Reply with general error message.
                console.log(result.message);
                ctx.reply('Something went wrong :(');
            });
    }
};

/**
 * Reply top mastery champions.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.getTopMasteryChampions = (ctx, next) => {

    // Parse arguments 
    parseArguments(ctx, 2);

    if (!validateArguments(ctx)) {
        ctx.reply(ctx.userInfo.message);
        next();
    }
    else {
        // Get top mastery champions.
        commandModel.getTopMasteryChampions(ctx.userInfo.summonerName, ctx.userInfo.region)
            .then(function (result) {
                // Reply with top mastery champions.
                ctx.reply(result.topMasteryChampionsArray ? commandModel.parseTopMasteryChampions(result.topMasteryChampionsArray, ctx.userInfo.summonerName) : result.message, { parse_mode: 'Markdown' });
            }).catch(function (result) {
                // Reply with general error message.
                console.log(result.message);
                ctx.reply('Something went wrong :(');
            });
    }

};

/**
 * Reply recent game information.
 * @param {Object} ctx context object
 * @param {Function} next next function
 */
exports.getRecentGameInformation = (ctx, next) => {

    // Parse arguments 
    parseArguments(ctx, 2);

    if (!validateArguments(ctx)) {
        ctx.reply(ctx.userInfo.message);
        next();
    }
    else {
        // Get summoner ranked information.
        commandModel.getRecentGameInformation(ctx.userInfo.summonerName, ctx.userInfo.region)
            .then(function (result) {
                ctx.reply(result.gameInformationObject ? commandModel.parseRecentGameInformation(result.gameInformationObject, ctx.userInfo.summonerName) : result.message, { parse_mode: 'Markdown' });
            }).catch(function (result) {
                console.log(result.message);
                ctx.reply('Something went wrong :(');
            });
    }
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

    const args = [];

    // Remove double spaces and split by space.
    const formattedArguments = ctx.message.text.replace(/  +/g, ' ');
    const argumentsArray = formattedArguments.split(' ');

    // Slice the num - 1 arguments
    const newArgumentsArray = argumentsArray.slice(1, num);

    //  Combine the last argument
    const leftoversArray = argumentsArray.slice(num);
    const leftoversString = leftoversArray.join(' ');

    if (leftoversString !== '')
        newArgumentsArray.push(leftoversString);

    ctx.args = newArgumentsArray;
};

/**
 * Validate arguments and injects them into ctx.
 * Valid command should look like; /command [region] summonerName
 * Default region in case of a single argument is EUNE.
 * @param {Object} ctx context object.
 * @return {Boolean} Valid arguments.
 */
const validateArguments = (ctx) => {

    ctx.userInfo = {};

    // No arguments supplied - Using config.users info 
    if (ctx.args.length == 0) {
        ctx.userInfo.region = (config.users[ctx.message.from.username]).region;
        ctx.userInfo.summonerName = (config.users[ctx.message.from.username]).summonerName;
    }
    // Single argument - Summoner name.
    else if (ctx.args.length === 1) {
        ctx.userInfo.region = 'EUNE';
        ctx.userInfo.summonerName = ctx.args[0];
    }
    // Two arguments - region, summoner name.q
    else if (ctx.args.length === 2) {

        const formattedRegion = ctx.args[0].toUpperCase();
        if (staticData.isValidRegion(formattedRegion)) {
            ctx.userInfo.region = formattedRegion;
            ctx.userInfo.summonerName = ctx.args[1];
        }
        else {
            ctx.userInfo.message = 'Invalid region. \nAvailable regions: ' + staticData.getValidRegions();;
            return false;
        }
    }
    // Invalid number of arguments.
    else {
        ctx.userInfo.message = 'Wrong number of arguments.';
        return false;
    }

    return true;
};
