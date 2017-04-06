'use strict';

const staticData = require('./staticData');
const Promise = require('promise');
const request = require('request');
const config = require('../../config/config');

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
            const apiAddress = 'https://' + staticData.regionalEndpoints[region].host + '/api/lol/' + region + '/v1.4/summoner/by-name/' +
                formattedName + '?api_key=' + config.riotAPIKey;
            console.info(apiAddress);

            // Send API request.
            request(apiAddress, (error, response, body) => {
                if (error) {
                    console.error(error);
                    result.message = 'Something went wrong :(';
                    reject(result);
                }
                else if (response.statusCode == 404) {
                    result.message = 'Summoner not found.';
                    fulfill(result);
                }
                else if (response.statusCode == 200) {

                    const jsonObject = JSON.parse(body);
                    const summonerObject = jsonObject[formattedName];

                    result.summonerObject = summonerObject;
                    fulfill(result);
                }
                else {
                    result.message = 'Something went wrong :(';
                    reject(result);
                }
            });
        }
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
                    const apiAddress = 'https://' + (staticData.regionalEndpoints[region]).host + '/championmastery/location/' +
                        (staticData.regionalEndpoints[region]).platformId + '/player/' + summonerObject.id +
                        '/topchampions?count=' + amountOfChampions + '&api_key=' + config.riotAPIKey;
                    console.info(apiAddress);

                    // Send API request.
                    request(apiAddress, (error, response, body) => {
                        if (error) {
                            console.error(error);
                            masteryResult.message = 'Something went wrong :(';
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
                                masteryResult.topMasteryChampionsArray = jsonObject;
                                fulfill(masteryResult);
                            }
                        }
                        else {
                            masteryResult.message = 'Something went wrong :(';
                            reject(masteryResult);
                        }
                    });
                }
            }).catch((result) => {
                console.log(result.message);
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
                    const apiAddress = 'https://' + (staticData.regionalEndpoints[region]).host + '/api/lol/' + region + '/v2.5/league/by-summoner/' +
                        summonerObject.id + '/entry' + '?api_key=' + config.riotAPIKey;
                    console.log(apiAddress);

                    // Send API request.
                    request(apiAddress, (error, response, body) => {
                        if (error) {
                            console.error(error);
                            rankedResult.message = 'Something went wrong :(';
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
                                rankedResult.rankedInformationArray = jsonObject[summonerObject.id];
                                fulfill(rankedResult);
                            }
                        }
                        else {
                            rankedResult.message = 'Something went wrong :(';
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
}

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
                    const apiAddress = 'https://' + (staticData.regionalEndpoints[region]).host + '/api/lol/' + region + '/v1.3/game/by-summoner/' +
                        summonerObject.id + '/recent' + '?api_key=' + config.riotAPIKey;
                    console.log(apiAddress);

                    // Send API request.
                    request(apiAddress, (error, response, body) => {
                        if (error) {
                            console.error(error);
                            recentResult.message = 'Something went wrong :(';
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
                                recentResult.gameInformationObject = jsonObject.games[0];
                                fulfill(recentResult);
                            }
                        }
                        else {
                            recentResult.message = 'Something went wrong :(';
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
}

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
        if (rankedInformationArray[i].queue == 'RANKED_SOLO_5x5')
            queueType = 'Solo/Duo';
        else if (rankedInformationArray[i].queue == 'RANKED_FLEX_SR')
            queueType = 'Flex 5v5';
        else if (rankedInformationArray[i].queue == 'RANKED_FLEX_TT')
            queueType = 'Flex 3v3';
        else
            queueType = 'General';

        rankedInformation += queueType + ' - ' + rankedInformationArray[i].tier + ' ' +
            rankedInformationArray[i].entries[0].division + ' (' + rankedInformationArray[i].entries[0].leaguePoints + ' points) \n';
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

    // Game time
    const minutesInGame = Math.floor(gameInformationObject.stats.timePlayed % 3600 / 60);
    const secondsInGame = Math.floor(gameInformationObject.stats.timePlayed % 3600 % 60);

    // KDA
    const championKills = gameInformationObject.stats.championsKilled === undefined ? 0 : gameInformationObject.stats.championsKilled;
    const championDeaths = gameInformationObject.stats.numDeaths === undefined ? 0 : gameInformationObject.stats.numDeaths;
    const championAssists = gameInformationObject.stats.assists === undefined ? 0 : gameInformationObject.stats.assists;

    // Creep Score
    const minionsKilled = gameInformationObject.stats.minionsKilled === undefined ? 0 : gameInformationObject.stats.minionsKilled;
    const neutralMinionsKilled = gameInformationObject.stats.neutralMinionsKilled === undefined ? 0 : gameInformationObject.stats.neutralMinionsKilled;
    const totalMinionKills = minionsKilled + neutralMinionsKilled;

    // Gold
    const goldEarned = gameInformationObject.stats.goldEarned === undefined ? 0 : gameInformationObject.stats.goldEarned;

    // Total damage dealt to champions
    const totalDamageDealtToChampions = gameInformationObject.stats.totalDamageDealtToChampions === undefined ? 0 : gameInformationObject.stats.totalDamageDealtToChampions;

    // Game mode
    if (gameInformationObject.gameMode == 'CLASSIC') {
        if (gameInformationObject.subType == 'RANKED_SOLO_5x5')
            gameMode = 'Ranked Solo/Duo';
        else if (gameInformationObject.subType == 'RANKED_FLEX_SR')
            gameMode = 'Ranked Flex 5v5';
        else if (gameInformationObject.subType == 'RANKED_FLEX_TT')
            gameMode = 'Ranked Flex 3v3';
        else
            gameMode = gameInformationObject.subType;
    }
    else {
        gameMode = gameInformationObject.gameMode;
    }

    // Build recent game information string.

    // Headline
    recentGameInfo = '*Recent Game - ' + summonerName + '*\n';

    // Game result
    recentGameInfo += gameInformationObject.stats.win == true ? 'VICTORY - ' : 'DEFEAT - ';

    // Game mode and time
    recentGameInfo += gameMode + ' (' + minutesInGame + ':' + secondsInGame + ')' + '\n';

    // Champion KDA
    recentGameInfo += championKills + '/' + championDeaths + '/' + championAssists +
        ' as ' + (staticData.championsObject[gameInformationObject.championId]).name + '\n';

    // CS and Gold.
    recentGameInfo += 'CS: ' + totalMinionKills + ', Gold: ' + goldEarned.toLocaleString('en-US') + '\n';

    // Total damage done
    recentGameInfo += 'Total damage done: ' + totalDamageDealtToChampions.toLocaleString('en-US');

    return recentGameInfo;

};