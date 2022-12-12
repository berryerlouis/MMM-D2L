const D2LApi = {
    GET_DATA_REQ: 'GET_DATA_REQ',
    GET_DATA_RES: 'GET_DATA_RES',
    APIKEY_URL: 'https://d2lapi.sicame.io/api/D2L/Security/GetAPIKey',
    APIKEY_REQ: 'APIKEY_REQ',
    APIKEY_RES: 'APIKEY_RES',
    COMPTEUR_URL: 'https://d2lapi.sicame.io/api/D2L/D2Ls',
    COMPTEUR_REQ: 'COMPTEUR_REQ',
    COMPTEUR_RES: 'COMPTEUR_RES',
    LAST_INDEX_URL: function (compteurId) {
        return `https://d2lapi.sicame.io/api/D2L/D2Ls/${compteurId}/LastIndexes`
    },
    LAST_INDEX_REQ: 'LAST_INDEX_REQ',
    LAST_INDEX_RES: 'LAST_INDEX_RES',
    LAST_INDEXES_URL: function (compteurId, nbHoursToFetch) {
        let current = new Date().toISOString();
        let yesterday = new Date(new Date().getTime() - (parseInt(nbHoursToFetch) * 60 * 60 * 1000)).toISOString();
        return `https://d2lapi.sicame.io/api/D2L/D2Ls/${compteurId}/IndexesBetween?from=${yesterday}&to=${current}`
    },
    LAST_INDEXES_REQ: 'LAST_INDEXES_REQ',
    LAST_INDEXES_RES: 'LAST_INDEXES_RES',
    LAST_CURRENT_URL: function (compteurId) {
        return `https://d2lapi.sicame.io/api/D2L/D2Ls/${compteurId}/LastCurrents`
    },
    LAST_CURRENT_REQ: 'LAST_CURRENT_REQ',
    LAST_CURRENT_RES: 'LAST_CURRENT_RES',
    LAST_CURRENTS_URL: function (compteurId, nbHoursToFetch) {
        let current = new Date().toISOString();
        let yesterday = new Date(new Date().getTime() - (parseInt(nbHoursToFetch) * 60 * 60 * 1000)).toISOString();
        return `https://d2lapi.sicame.io/api/D2L/D2Ls/${compteurId}/CurrentsBetween?from=${yesterday}&to=${current}`
    },
    LAST_CURRENTS_REQ: 'LAST_CURRENTS_REQ',
    LAST_CURRENTS_RES: 'LAST_CURRENTS_RES',
};
module?.exports = { D2LApi }