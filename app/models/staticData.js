'use strict';

const Promise = require('promise');
const request = require('request');
const config = require('../../config/config');

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
 * Get champions list.
 * @returns {Promise} result
 * @resolves {Object} result.championsObject
 * @rejects {String} result.message
 */
const loadChampions = () => {

    return new Promise((fulfill, reject) => {

        let result = {};

        const apiAddress = encodeURI('https://global.api.riotgames.com/api/lol/static-data/EUW/v1.2/champion?dataById=true&api_key=' + config.riotAPIKey);
        console.info(apiAddress);

        // Send API request.
        request(apiAddress, (error, response, body) => {
            if (error) {
                console.error(error);
                result.message = 'Something went wrong :(';
                reject(result);
            }
            else if (response.statusCode == 404) {
                result.message = 'Something went wrong :(';
                reject(result);
            }
            else if (response.statusCode == 200) {

                const jsonObject = JSON.parse(body);
                result.championsObject = jsonObject.data;
                fulfill(result);
            }
            else {
                result.message = 'Something went wrong :(';
                reject(result);
            }
        });
    });
};

// Load static data.

// Champion object.
loadChampions().
    then((result) => {
        module.exports.championsObject = result.championsObject;
    }).catch((result) => {
        module.exports.championsObject = undefined;
    });

// Regions.
module.exports.regionalEndpoints = regionalEndpoints;