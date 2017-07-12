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
    'BR': { platformId: 'BR1', host: 'br.api.riotgames.com' },
    'EUNE': { platformId: 'EUN1', host: 'eune.api.riotgames.com' },
    'EUW': { platformId: 'EUW1', host: 'euw.api.riotgames.com' },
    'JP': { platformId: 'JP1', host: 'jp.api.riotgames.com' },
    'KR': { platformId: 'KR', host: 'kr.api.riotgames.com' },
    'LAN': { platformId: 'LA1', host: 'lan.api.riotgames.com' },
    'LAS': { platformId: 'LA2', host: 'las.api.riotgames.com' },
    'NA': { platformId: 'NA1', host: 'na.api.riotgames.com' },
    'OCE': { platformId: 'OC1', host: 'oce.api.riotgames.com' },
    'TR': { platformId: 'TR1', host: 'tr.api.riotgames.com' },
    'RU': { platformId: 'RU', host: 'ru.api.riotgames.com' },
    'PBE': { platformId: 'PBE1', host: 'pbe.api.riotgames.com' }
};

/**
 * Get static data.
 * @returns {Promise} result
 * @resolves {Object} result.dataObject
 * @rejects {String} result.message
 */
const getStaticDataFromServer = (data) => {
    console.log(`gathering ${data} data from server...`);
    return new Promise((fulfill, reject) => {

        let result = {};
        let currentStaticDictionary = getDataDict(data);
        if (currentStaticDictionary === ERROR) {
            console.log(`could not identify the data you requested : ${data}`);
            result.message = `could not identify the data you requested : ${data}`;
            reject(result);
        } else {
            let apiAddress = encodeURI(`https://${region}.api.riotgames.com/lol/static-data/v3/${data}?locale=en_US&dataById=false&api_key=${config.riotAPIKey}`);
            // console.log(apiAddress);

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
            console.log("Done! got everything I need");
            console.log();
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

// Regions.
module.exports.regionalEndpoints = regionalEndpoints;