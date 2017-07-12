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
            ctx.reply(config.messages.SAD_MESSAGE);
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
            ctx.reply(config.messages.SAD_MESSAGE);
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
            ctx.reply(config.messages.SAD_MESSAGE);
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
    let gameMessage = ctx.message.from.first_name + ' (' + ctx.message.from.username + ') ';
    gameMessage += ctx.args == '' ? 'is looking for feeders for the rift!\n' : ': ' + ctx.args[0] + '\n';

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
            ctx.reply(config.messages.SAD_MESSAGE);
        });
};

/**
 * Reply a champion's highest winrate build according to championGG
 */
exports.getHighestWinrateBuild = (ctx, next) => {

    // Parse arguments 
    parseArguments(ctx, 2);
    ctx.args[0] = parseRole(ctx.args[0]);
    if (!(isRole(ctx.args[0]))) {
        ctx.args[1] = ctx.args[0];
        ctx.args[0] = '';
    }
    commandModel.getHighestWinrateBuild(ctx.args[0], parseChampionName(ctx.args[1]))
        .then((result) => {
            ctx.reply(result, { parse_mode: 'Markdown' });
        })
        .catch((result) => {
            console.log(result.message);
            ctx.reply(result.message);
        });
}

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
    let ret = arr.splice(1, num - 1);
    ret.push(arr.splice(1).join(' '));

    ctx.args = ret;
};

/**
 * checks if a given string represents a role
 * @param {string} role
 */
const isRole = (role) => {
    return (role === 'TOP' || role == 'JUNGLE' || role == 'MIDDLE' || role == 'DUO_CARRY' || role == 'DUO_SUPPORT');
};

/**
 * parses a given name into official champion name
 * @param {string} name  name to parse
 *  * @returns {string} official champion name
 */
const parseChampionName = (name) => {
    switch (name.toLocaleLowerCase()) {
        case "ali": {
            return "Alistar";
        }
        case "mumu": {
            return "Amumu";
        }
        case "ao shin": 
        case "ao": 
        case "aurelion": {
            return "AurelionSol";
        }
        case "blitz": {
            return "Alitzcrank";
        }
        case "cait": {
            return "caitlyn";
        }
        case "cassio":
        case "cass": {
            return "Cassiopeia";
        }
        case "cho": {
            return "Chogath";
        }
        case "mundo":
        case "drmundo":
        case "dr.mundo":
        case "dr": {
            return "DrMundo";
        }
        case "eve": {
            return "Evelynn";
        }
        case "ez": {
            return "Ezreal";
        }
        case "fiddle": {
            return "Fiddlesticks";
        }
        case "gp": {
            return "Gangplank";
        }
        case "donger":
        case "heimer": {
            return "Heimerdinger";
        }
        case "j4":
        case "jarvan4":
        case "jarvan": {
            return "JarvanIV"
        }
        case "kass": {
            return "Kassadin";
        }
        case "kata": {
            return "Katarina";
        }
        case "kha": {
            return "Kha'Zix";
        }
        case "kog": {
            return "KogMaw";
        }
        case "lb": {
            return "LeBlanc";
        }
        case "lee": {
            return "LeeSin";
        }
        case "leo": {
            return "Leona";
        }
        case "liss": {
            return "Lissandra";
        }
        case "luci": {
            return "Lucian";
        }
        case "malph": {
            return "Malphite";
        }
        case "malz": {
            return "Malzahar";
        }
        case "mao": {
            return "Maokai"
        }
        case "master":
        case "master yi":
        case "yi": {
            return "MasterYi";
        }
        case "mf": {
            return "MissFortune";
        }
        case "morde": {
            return "Mordekaiser";
        }
        case "morg": {
            return "Morgana";
        }
        case "naut": {
            return "Nautilus";
        }
        case "nida": {
            return "Nidalee";
        }
        case "noc": {
            return "Nocturne";
        }
        case "ori": {
            return "Orianna";
        }
        case "panth": {
            return "Pantheon";
        }
        case "reksai":
        case "rek": {
            return "RekSai";
        }
        case "rene": {
            return "Renekton";
        }
        case "seju":
        case "sej": {
            return "Sejuani";
        }
        case "shyv": {
            return "Shyvana";
        }
        case "banana":
        case "raka": {
            return "Soraka";
        }
        case "kench":
        case "tahm": {
            return "TahmKench";
        }
        case "tali": {
            return "Taliyah";
        }
        case "satan": {
            return "Teemo";
        }
        case "trist": {
            return "Tristana";
        }
        case "trynda":
        case "trynd": {
            return "Tryndamere";
        }
        case "twisted":
        case "tf": {
            return "TwistedFate";
        }
        case "velkoz":
        case "koz":
        case "vel": {
            return "Velkoz";
        }
        case "vladi":
        case "vlad": {
            return "Vladimir";
        }
        case "voli": {
            return "Volibear";
        }
        case "ww": {
            return "Warwick";
        }
        case "wu": 
        case "wu kong": 
        case "wukong": {
            return "MonkeyKing";
        }
        case "xin": {
            return "XinZhao";
        }
        case "cancer":
        case "salt":
        case "yass":
        case "yas": {
            return "Yasuo";
        }
        case "zil": {
            return "Zilean";
        }
        default: {
            return name;
        }
    }
}

/**
 * parses a given role into official role
 * @param {string} role role to parse
 * @returns {string} official role
 */
const parseRole = (role) => {
    switch (role.toLowerCase()) {
        case "top":
        case "t": {
            return "TOP";
        }
        case "j":
        case "jun":
        case "jung":
        case "jungl":
        case "jungle": {
            return "JUNGLE";
        }
        case "m":
        case "mid": 
        case "middle": {
            return "MIDDLE";
        }
        case "a":
        case "c":
        case "adc": {
            return "DUO_CARRY";
        }
        case "s":
        case "sup":
        case "supp": 
        case "support": {
            return "DUO_SUPPORT";
        }
        default:
            return role;
    };
};