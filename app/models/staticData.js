'use strict';

const Promise = require('promise');
const request = require('request');
const config = require('../../config/config');
const _ = require('lodash');

const CHAMPIONS = "champions";
const ITEMS = "items";
const MASTERIES = "masteries";
const RUNES = "runes";
const SUMMONER_SPELLS = "summoner-spells";
const region = 'eun1';
const ERROR = -1;
const TEEMO_ID = 17;
module.exports.TEEMO_ID = TEEMO_ID;
let championsData = {};
let itemsData = {};
let masteriesData = {};
let runesData = {};
let summonerSpellsData = {};

// Define static functions and objects.

// Regions.
const regionalEndpoints = {
    'BR': { platformId: 'BR1', host: 'br1.api.riotgames.com' },
    'EUNE': { platformId: 'EUN1', host: 'eun1.api.riotgames.com' },
    'EUW': { platformId: 'EUW1', host: 'euw1.api.riotgames.com' },
    'JP': { platformId: 'JP1', host: 'jp1.api.riotgames.com' },
    'KR': { platformId: 'KR', host: 'kr.api.riotgames.com' },
    'LAN': { platformId: 'LA1', host: 'la1.api.riotgames.com' },
    'LAS': { platformId: 'LA2', host: 'la2.api.riotgames.com' },
    'NA': { platformId: 'NA1', host: 'na1.api.riotgames.com' },
    'OCE': { platformId: 'OC1', host: 'oc1.api.riotgames.com' },
    'TR': { platformId: 'TR1', host: 'tr1.api.riotgames.com' },
    'RU': { platformId: 'RU', host: 'ru.api.riotgames.com' },
    'PBE': { platformId: 'PBE1', host: 'pbe1.api.riotgames.com' }
};

const queueTypes = {
    0: 'Custom',
    8: 'Normal 3v3',
    2: 'Normal 5v5 Blind Pick',
    14: 'Normal 5v5 Draft Pick',
    4: 'Ranked Solo 5v5',
    6: 'Ranked Premade 5v5',
    9: 'Ranked Flex Twisted Treeline',
    41: 'Ranked Team 3v3',
    42: 'Ranked Team 5v5',
    16: 'Dominion 5v5 Blind Pick',
    17: 'Dominion 5v5 Draft Pick',
    7: 'Coop vs AI',
    25: 'Dominion Coop vs AI',
    31: 'Coop vs AI Intro Bot',
    32: 'Coop vs AI Beginner Bot',
    33: 'Coop vs AI Intermediate Bot',
    52: 'Twisted Treeline Coop vs AI',
    61: 'Team Builder',
    65: 'ARAM',
    70: 'One for All',
    72: 'Snowdown Showdown 1v1',
    73: 'Snowdown Showdown 2v2',
    75: '6x6 Hexakill',
    76: 'Ultra Rapid Fire',
    78: 'One for All',
    83: 'Ultra Rapid Fire',
    91: 'Doom Bots Rank 1',
    92: 'Doom Bots Rank 2',
    93: 'Doom Bots Rank 3',
    96: 'Ascension',
    98: 'Twisted Treeline 6x6 Hexakill',
    100: 'Butcher\'s Bridge',
    300: 'King Poro',
    310: 'Nemesis',
    313: 'Black Market Brawlers',
    315: 'Nexus Siege',
    317: 'Definitely Not Dominion',
    318: 'All Random URF',
    325: 'All Random Summoner\'s Rift',
    400: 'Normal 5v5 Draft Pick',
    410: 'Ranked 5v5 Draft Pick',
    420: 'Ranked Solo Team Builder ',
    430: 'Normal 5v5 Blind Pick',
    440: 'Ranked Flex Summoner\'s Rift',
    600: 'Blood Hunt Assassin',
    610: 'Dark Star'
}

/**
 * Get static data.
 * @returns {Promise} result
 * @resolves {Object} result.dataObject
 * @rejects {String} result.message
 */
const getStaticDataFromServer = (data) => {
    return new Promise((fulfill, reject) => {

        let result = {};
        let currentStaticDictionary = getDataDict(data);
        if (currentStaticDictionary === ERROR) {
            console.log(`could not identify the data you requested : ${data}`);
            result.message = `could not identify the data you requested : ${data}`;
            reject(result);
        } else {
            let apiAddress = encodeURI(`https://${region}.api.riotgames.com/lol/static-data/v3/${data}?locale=en_US&dataById=false&api_key=${config.riotAPIKey}`);
            console.log(apiAddress)
            request(apiAddress, (error, response, body) => {
                if (error) {
                    console.error(error);
                    result.message = 'Something went wrong :(';
                    reject(result);
                }
                else {
                    let items = JSON.parse(body).data;
                    Object.keys(items).forEach((k) => {
                        currentStaticDictionary[items[k].id] = items[k];
                    });
                    fulfill(currentStaticDictionary);
                }
            });
        }
    });
};

/**
 * 
 * @param {*} data the data requested 
 * @returns the data structure for the requested data
 */
const getDataDict = (data) => {
    switch (data) {
        case CHAMPIONS: {
            return championsData;
        }
        case ITEMS: {
            return itemsData;
        }
        case MASTERIES: {
            return masteriesData;
        }
        case RUNES: {
            return runesData;
        }
        case SUMMONER_SPELLS: {
            return summonerSpellsData;
        }
        default: {
            return ERROR;
        }
    }
}

// Load static data.

const dataToGet = [
    getStaticDataFromServer(CHAMPIONS),
    getStaticDataFromServer(ITEMS),
    getStaticDataFromServer(MASTERIES),
    getStaticDataFromServer(RUNES),
    getStaticDataFromServer(SUMMONER_SPELLS)
];

//initialization of data
const init = () => {
    return new Promise((fulfill, reject) => {
        Promise.all(dataToGet).then(() => {
            console.log("Static data collected.");

            module.exports.championsObject = championsData;
            module.exports.itemsObject = itemsData;
            module.exports.masteriesObject = masteriesData;
            module.exports.runesObject = runesData;
            module.exports.summonerSpellsObject = summonerSpellsData;
            fulfill();
        });
    });
}

init();

module.exports.queueTypes = queueTypes;
module.exports.regionalEndpoints = regionalEndpoints;
