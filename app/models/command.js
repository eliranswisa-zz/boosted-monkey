'use strict';

const staticData = require('./staticData');
const Promise = require('promise');
const request = require('request');
const config = require('../../config/config');
const _ = require('lodash');
/**
 * Extracts summoner information by name.
 * @param {String} summonerName Summoner name
 * @param {String} region Region
 * @returns {Promise} result
 * @resolves {Object} result.summonerObject
 * @rejects {String} result.message
 */
const getSummonerByName = (summonerName, region) => {

    return new Promise((fulfill, reject) => {

        let result = {};

        // Get arrguments from call.
        const displayName = summonerName;
        const formattedName = displayName.toLowerCase().replace(/ /g, '');

        // Validate input according to region. 
        const validName = formattedName.match(/[0-9A-Za-zªµºÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿĂăĄąĆćĘęıŁłŃńŐőŒœŚśŞşŠšŢţŰűŸŹźŻżŽžƒȘșȚțˆˇˉΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩάέήίαβγδεζηθικλμνξοπρςστυφχψωόύώﬁﬂ]+$/g);

        if (validName === null) {
            result.message = 'Invalid summoner name.';
            fulfill(result);
        }
        else {
            const apiAddress = encodeURI('https://' + staticData.regionalEndpoints[region].host + '/lol/summoner/v3/summoners/by-name/' +
                formattedName + '?api_key=' + config.riotAPIKey);
            console.info(apiAddress);

            // Send API request.
            request(apiAddress, (error, response, body) => {
                if (error) {
                    console.error(error);
                    result.message = config.messages.SAD_MESSAGE;
                    reject(result);
                }
                else if (response.statusCode == 404) {
                    result.message = 'Summoner not found.';
                    fulfill(result);
                }
                else if (response.statusCode == 200) {

                    const jsonObject = JSON.parse(body);
                    result.summonerObject = jsonObject;
                    fulfill(result);
                }
                else {
                    result.message = config.messages.SAD_MESSAGE;
                    reject(result);
                }
            });
        }
    });
};

/**
 * Extracts the optimal champion build according to championGG
 * @returns {promise} fulfills the champion's highest winrate data
 */
exports.getHighestWinrateBuild = (champRole, champName) => {
    return new Promise((fulfill, reject) => {

        // Validate input (champ name)
        let champId = getChampKeyByName(champName).id;
        if (champId === config.messages.SAD_MESSAGE) {
            result.message = 'Could not find build for this champion/role';
            reject(result);
        } else {
            champName = champName[0].toUpperCase() + champName.toLowerCase().slice(1);
        }

        let result = {};

        let apiAddress = encodeURI(`http://api.champion.gg/v2/champions/${champId}/${champRole}?&limit=1&champData=hashes&api_key=${config.championGGKey}`);
        console.log(apiAddress);

        // Send API request
        request(apiAddress, (error, response, body) => {
            if (error) {
                console.error(error);
                result.message = config.messages.SAD_MESSAGE;
                reject(result);
            }
            else {
                try {
                    let firstItems = JSON.parse(body)[0].hashes.firstitemshash.highestWinrate.hash.split('-').slice(1);
                    let finalItems = JSON.parse(body)[0].hashes.finalitemshashfixed.highestWinrate.hash.split('-').slice(1);
                    let masteries = JSON.parse(body)[0].hashes.masterieshash.highestWinrate.hash.split('-');
                    let runes = JSON.parse(body)[0].hashes.runehash.highestWinrate.hash.split('-');
                    let skillOrder = JSON.parse(body)[0].hashes.skillorderhash.highestWinrate.hash.split('-').slice(1);
                    let summonerSpells = JSON.parse(body)[0].hashes.summonershash.highestWinrate.hash.split('-');
                    var ret = "";
                    ret += (`*${champName} ${champRole.toLowerCase()} build*\n`)
                    ret += ("*Start with : * " + parseItems(firstItems) + '\n');
                    ret += ("*Final build should be : *" + parseItems(finalItems) + '\n');
                    ret += ("*Summoner Spells :*" + parseSummonerSpells(summonerSpells) + '\n');
                    ret += ("*Runes :*" + parseRunes(runes) + '\n');
                    ret += ("*Masteries :*" + parseMasteries(masteries) + '\n');
                    ret += ("*Skill order :* " + skillOrder + '\n');
                    fulfill(ret);
                } catch (error) {
                    console.error(error);
                    result.message = 'Could not find build for this champion/role';
                    reject(result);
                }
            }
        });
    });
};

/**
 * Extracts top N champions for summoner.
 * @param {String} summonerName Summoner name.
 * @param {String} region Region
 * @param {Number} amountOfChampions amount of champions to show.
 * @returns {Promise} result
 * @resolves {Array} result.topMasteryChampionsArray
 * @rejects {String} result.message
 */
exports.getTopMasteryChampions = (summonerName, region, amountOfChampions = 5) => {

    return new Promise((fulfill, reject) => {

        let masteryResult = {};

        getSummonerByName(summonerName, region)
            .then((result) => {

                if (!result.summonerObject) {
                    masteryResult.message = result.message;
                    fulfill(masteryResult);
                }
                else {
                    // Valid summoner.
                    const summonerObject = result.summonerObject;
                    const apiAddress = encodeURI('https://' + staticData.regionalEndpoints[region].host + '/lol/champion-mastery/v3/champion-masteries/by-summoner/' +
                        summonerObject.id + '?api_key=' + config.riotAPIKey);
                    console.info(apiAddress);

                    // Send API request.
                    request(apiAddress, (error, response, body) => {
                        if (error) {
                            console.error(error);
                            masteryResult.message = config.messages.SAD_MESSAGE;
                            reject(masteryResult);
                        }
                        else if (response.statusCode == 404) {
                            masteryResult.message = 'No data for ' + summonerName;
                            fulfill(masteryResult);
                        }
                        else if (response.statusCode == 200) {

                            const jsonObject = JSON.parse(body);

                            if (jsonObject.length == 0) {
                                masteryResult.message = 'No data for ' + summonerName;
                                fulfill(masteryResult);
                            }
                            else {
                                // Grab the top N
                                const topChampionsArray = jsonObject.slice(0, amountOfChampions);
                                masteryResult.topMasteryChampionsArray = topChampionsArray;
                                fulfill(masteryResult);
                            }
                        }
                        else {
                            masteryResult.message = config.messages.SAD_MESSAGE;
                            reject(masteryResult);
                        }
                    });
                }
            }).catch((result) => {
                ret.push(result.message);
                masteryResult.message = result.message;
                reject(masteryResult);
            });
    });

};

/**
 * Extracts summoner's ranked information.
 * @param {String} summonerName Summoner name
 * @param {String} region Region
 * @returns {Promise} result
 * @resolves {Array} result.rankedInformationArray
 * @rejects {String} result.message
 */
exports.getRankedInformation = (summonerName, region) => {

    return new Promise((fulfill, reject) => {

        let rankedResult = {};

        getSummonerByName(summonerName, region)
            .then((result) => {

                if (!result.summonerObject) {
                    rankedResult.message = result.message;
                    fulfill(rankedResult);
                }
                else {
                    // Valid summoner.
                    const summonerObject = result.summonerObject;
                    const apiAddress = encodeURI('https://' + staticData.regionalEndpoints[region].host + '/lol/league/v3/positions/by-summoner/' +
                        summonerObject.id + '?api_key=' + config.riotAPIKey);
                    console.log(apiAddress);

                    // Send API request.
                    request(apiAddress, (error, response, body) => {
                        if (error) {
                            console.error(error);
                            rankedResult.message = config.messages.SAD_MESSAGE;
                            reject(rankedResult);
                        }
                        else if (response.statusCode == 404) {
                            rankedResult.message = 'No data for ' + summonerName;
                            fulfill(rankedResult);
                        }
                        else if (response.statusCode == 200) {

                            const jsonObject = JSON.parse(body);

                            if (jsonObject.length == 0) {
                                rankedResult.message = 'No data for ' + summonerName;
                                fulfill(rankedResult);
                            }
                            else {
                                rankedResult.rankedInformationArray = jsonObject;
                                fulfill(rankedResult);
                            }
                        }
                        else {
                            rankedResult.message = config.messages.SAD_MESSAGE;
                            reject(rankedResult);
                        }
                    });
                }
            }).catch((result) => {
                console.log(result.message);
                rankedResult.message = result.message;
                reject(rankedResult);
            });
    });
};

/**
 * Extracts summoner's recent game information.
 * @param {String} summonerName Summoner name
 * @param {String} region Region
 * @returns {Promise} result
 * @resolves {Array} result.gameInformationObject
 * @rejects {String} result.message
 */
exports.getRecentGameInformation = (summonerName, region) => {

    return new Promise((fulfill, reject) => {

        let recentResult = {};

        getSummonerByName(summonerName, region)
            .then((result) => {

                if (!result.summonerObject) {
                    recentResult.message = result.message;
                    fulfill(recentResult);
                }
                else {
                    // Valid summoner. 
                    const summonerObject = result.summonerObject;
                    const apiAddress = encodeURI('https://' + staticData.regionalEndpoints[region].host + '/lol/match/v3/matchlists/by-account/' +
                        summonerObject.accountId + '/recent' + '?api_key=' + config.riotAPIKey);
                    console.log(apiAddress);

                    // Send API request.
                    request(apiAddress, (error, response, body) => {
                        if (error) {
                            console.error(error);
                            recentResult.message = config.messages.SAD_MESSAGE;
                            reject(recentResult);
                        }
                        else if (response.statusCode == 404) {
                            recentResult.message = 'No data for ' + summonerName;
                            fulfill(recentResult);
                        }
                        else if (response.statusCode == 200) {
                            const jsonObject = JSON.parse(body);

                            if (jsonObject.length == 0) {
                                recentResult.message = 'No data for ' + summonerName;
                                fulfill(recentResult);
                            }
                            else {
                                const gameId = jsonObject.matches[0].gameId;
                                const apiAddress = encodeURI('https://' + staticData.regionalEndpoints[region].host + '/lol/match/v3/matches/' +
                                    gameId + '?api_key=' + config.riotAPIKey);
                                console.log(apiAddress);

                                // Send API request.
                                request(apiAddress, (error, response, body) => {
                                    if (error) {
                                        console.error(error);
                                        recentResult.message = config.messages.SAD_MESSAGE;
                                        reject(recentResult);
                                    }
                                    else if (response.statusCode == 404) {
                                        recentResult.message = 'No data for ' + summonerName;
                                        fulfill(recentResult);
                                    }
                                    else if (response.statusCode == 200) {
                                        
                                        const jsonObject = JSON.parse(body);
                                        recentResult.gameInformationObject = jsonObject;
                                        fulfill(recentResult);
                                    }
                                });
                            }
                        }
                        else {
                            recentResult.message = config.messages.SAD_MESSAGE;
                            reject(recentResult);
                        }
                    });
                }
            }).catch((result) => {
                console.log(result.message);
                recentResult.message = result.message;
                reject(recentResult);
            });
    });
};

/**
 * Extract top N live twitch channels of League of Legends
 * @param {Number} amountOfChannels top N channels, default is 3
 * @returns {Promise} result
 * @resolves {Object} result.streamInformationObject
 * @rejects {String} result.message
 */
exports.getTopTwitchChannels = (amountOfChannels = 3) => {

    return new Promise((fulfill, reject) => {

        let result = {};

        let apiAddress = encodeURI('https://api.twitch.tv/kraken/streams/?game=League of Legends&limit=' + amountOfChannels + '&client_id=' + config.twitchToken);
        console.log(apiAddress);

        request(apiAddress, (error, response, body) => {

            if (error) {
                console.error(error);
                result.message = config.messages.SAD_MESSAGE;
                reject(result);
            }
            else {
                const jsonObject = JSON.parse(body);
                result.streamInformationObject = jsonObject;
                fulfill(result);
            }
        });
    });
};

/**
 * Parses rankedInformationArray into a string for reply.
 * @param {Array} rankedInformationArray Ranked information array.
 * @param {String} summonerName Summoner name
 * @returns {String} Formatted ranked information string.
 */
exports.parseRankedInformation = (rankedInformationArray, summonerName) => {

    let queueType;
    let rankedInformation = '*Ranked Standings - ' + summonerName + '*\n';

    for (let i = 0; i < rankedInformationArray.length; i++) {

        // Beautify queue type.
        if (rankedInformationArray[i].queueType == 'RANKED_SOLO_5x5')
            queueType = 'Solo/Duo';
        else if (rankedInformationArray[i].queueType == 'RANKED_FLEX_SR')
            queueType = 'Flex 5v5';
        else if (rankedInformationArray[i].queueType == 'RANKED_FLEX_TT')
            queueType = 'Flex 3v3';
        else
            queueType = 'General';

        rankedInformation += queueType + ' - ' + rankedInformationArray[i].tier + ' ' +
            rankedInformationArray[i].rank + ' (' + rankedInformationArray[i].leaguePoints + ' points) \n';
    }

    return rankedInformation;
};

/**
 * Parses topMasteryChampionsArray into a string for reply.
 * Extract champion names from static object.
 * @param {Array} topMasteryChampionsArray Top mastery champions array.
 * @param {String} summonerName Summoner name
 * @returns {String} Formatted top mastery champions string..
 */
exports.parseTopMasteryChampions = (topMasteryChampionsArray, summonerName) => {

    const championsObject = staticData.championsObject;
    let tokenInformation;
    let championName;
    let topMasteryInfo = '*Top Mastery Champions - ' + summonerName + '*\n';

    for (let i = 0; i < topMasteryChampionsArray.length; i++) {

        // Define amount of tokens needed.
        if (topMasteryChampionsArray[i].championLevel == 5) {
            tokenInformation = topMasteryChampionsArray[i].tokensEarned + '/2';
        }
        else if (topMasteryChampionsArray[i].championLevel == 6) {
            tokenInformation = topMasteryChampionsArray[i].tokensEarned + '/3';
        }
        else {
            tokenInformation = '';
        }

        // Get champion name from static champions object.
        championName = (championsObject[topMasteryChampionsArray[i].championId]).name;

        topMasteryInfo += i + 1 + '. ' + championName + ' - ' + topMasteryChampionsArray[i].championPoints.toLocaleString('en-US')
            + ' Points, Level ' + topMasteryChampionsArray[i].championLevel + ' ' + tokenInformation + '\n';
    }

    return topMasteryInfo;

};

/**
 * Parses gameInformationObject into a string for reply.
 * Extract champion names from static object.
 * @param {Array} gameInformationObject Recent game object.
 * @param {String} summonerName Summoner name
 * @returns {String} Formatted Recent game information.
 */
exports.parseRecentGameInformation = (gameInformationObject, summonerName) => {

    let recentGameInfo;
    let gameMode;

    const formattedName = summonerName.toLowerCase().replace(/ /g, '');
    
    // Game time
    const minutesInGame = Math.floor(gameInformationObject.gameDuration % 3600 / 60);
    const secondsInGame = Math.floor(gameInformationObject.gameDuration % 3600 % 60);

    // Game mode
    if (staticData.queueTypes[gameInformationObject.queueId])
        gameMode = staticData.queueTypes[gameInformationObject.queueId];
    else
        gameMode = 'General';

    // Get participant ID
    const participantIdentityObject = gameInformationObject.participantIdentities.filter((participant) => participant.player.summonerName.toLowerCase() == formattedName)[0];
    if (!participantIdentityObject) {
        return config.SAD_MESSAGE;
    }

    const participantId = participantIdentityObject.participantId;
    const participantData = gameInformationObject.participants.filter((participant) => participant.participantId == participantId)[0];

    // KDA
    const championKills = participantData.stats.kills === undefined ? 0 : participantData.stats.kills;
    const championDeaths = participantData.stats.deaths === undefined ? 0 : participantData.stats.deaths;
    const championAssists = participantData.stats.assists === undefined ? 0 : participantData.stats.assists;

    // Creep Score
    const minionsKilled = participantData.stats.totalMinionsKilled === undefined ? 0 : participantData.stats.totalMinionsKilled;
    const neutralMinionsKilled = participantData.stats.neutralMinionsKilled === undefined ? 0 : participantData.stats.neutralMinionsKilled;
    const totalMinionKills = minionsKilled + neutralMinionsKilled;

    // Gold
    const goldEarned = participantData.stats.goldEarned === undefined ? 0 : participantData.stats.goldEarned;

    // Total damage dealt to champions
    const totalDamageDealtToChampions = participantData.stats.totalDamageDealtToChampions === undefined ? 0 : participantData.stats.totalDamageDealtToChampions;

    // Build recent game information string.

    // Headline
    recentGameInfo = '*Recent Game - ' + summonerName + '*\n';

    // Game result
    recentGameInfo += participantData.stats.win == true ? 'VICTORY - ' : 'DEFEAT - ';

    // Game mode and time
    recentGameInfo += gameMode + ' (' + minutesInGame + ':' + secondsInGame + ')' + '\n';

    // Champion KDA
    recentGameInfo += championKills + '/' + championDeaths + '/' + championAssists +
        ' as ' + (staticData.championsObject[participantData.championId].name) + '\n';

    // CS and Gold.
    recentGameInfo += 'CS: ' + totalMinionKills + ', Gold: ' + goldEarned.toLocaleString('en-US') + '\n';

    // Total damage done
    recentGameInfo += 'Total damage done: ' + totalDamageDealtToChampions.toLocaleString('en-US') + '\n';

    // Match history link
    recentGameInfo += 'http://matchhistory.eune.leagueoflegends.com/en/#match-details/' + participantIdentityObject.player.platformId + '/' + gameInformationObject.gameId
        + '/' + participantIdentityObject.player.accountId;

    return recentGameInfo;

};

/**
 * Parses streamInformationObject into a string for reply.
 * @param {Object} streamInformationObject Recent game object.
 * @returns {String} Formatted top channels string.
 */
exports.parseTopTwitchChannels = (streamInformationObject) => {

    let topChannelsInfo = '';

    for (let i = 0; i < streamInformationObject.streams.length; i++) {
        topChannelsInfo += '<b>' + streamInformationObject.streams[i].channel.display_name + ' is live!</b>\n' +
            streamInformationObject.streams[i].channel.status + ' (' + streamInformationObject.streams[i].viewers.toLocaleString('en-US') + ' viewers)\n' +
            streamInformationObject.streams[i].channel.url + '\n\n';
    };

    return topChannelsInfo;
};

/**
 * Parses items by Ids into strings
 * @param {String[]} list  list of IDs
 * @returns {String[]} list of item names by ID
 */
const parseItems = (list) => {
    let ret = [];
    list.forEach((data) => {
        let dataInfo = _.filter(staticData.itemsObject, (item) => {
            return item.id == data;
        });
        if (typeof (dataInfo[0]) !== 'undefined') {
            ret.push(" " + dataInfo[0].name);
        } else {
            console.log("missing item info : " + data);
        }
    });
    return ret;
}

/**
 * Parses runes by Ids into strings
 * @param {String[]} list  list of IDs
 * @returns {String[]} list of runes names by ID
 */
const parseRunes = (list) => {
    let ret = [];
    for (let i = 0; i < list.length; i += 2) {
        let data = list[i];
        let dataInfo = _.filter(staticData.runesObject, (item) => {
            return item.id == data;
        });
        if (typeof (dataInfo[0]) !== 'undefined') {
            ret.push(` ${list[i + 1]}x ${dataInfo[0].name}`);
        } else {
            console.log("missing item info : " + data);
        }
    }
    return ret;
}

/**
 * Parses summoner spells by Ids into strings
 * @param {String[]} list  list of IDs
 * @returns {String[]} list of summoner spells names by ID
 */
const parseSummonerSpells = (list) => {
    let ret = [];
    list.forEach((data) => {
        let dataInfo = _.filter(staticData.summonerSpellsObject, (item) => {
            return item.id == data;
        });
        if (typeof (dataInfo[0]) !== 'undefined') {
            ret.push(" " + dataInfo[0].name);
        } else {
            console.log("missing item info : " + data);
        }
    });
    return ret;
}

/**
 * Parses masteries by Ids into strings
 * @param {String[]} list  list of IDs
 * @returns {String[]} list of masteries names by ID
 */
const parseMasteries = (list) => {
    let ret = [];
    for (let i = 0; i < list.length; i += 2) {
        let data = list[i];
        let dataInfo = _.filter(staticData.masteriesObject, (item) => {
            return item.id == data;
        });
        if (typeof (dataInfo[0]) !== 'undefined') {
            ret.push(` ${list[i + 1]}x ${dataInfo[0].name}`);
        } else {
            console.log("missing item info : " + data);
        }
    }
    return ret;
}

/**
 * Gets champion's ID by name
 * @param {String} champName chmapion name
 * @returns {string} champion's ID
 */
const getChampKeyByName = (champName) => {
    let result = _.filter(staticData.championsObject, (champ) => {
        return champ.key.toLowerCase() === champName.toLowerCase();
    });
    if (result.length === 0) {
        return (config.messages.SAD_MESSAGE);
    }
    return result[0];
}