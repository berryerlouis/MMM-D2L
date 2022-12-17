"use strict";

const NodeHelper = require("node_helper");
const XMLHttpRequest = require('xhr2');
const Log = require("logger");
const { D2LApi } = require("./d2l");


function apiPost(url, login, password, callback) {
  const data = JSON.stringify({
    "login": login,
    "password": password
  });

  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (this.status == 200) {
      if (this.readyState === this.DONE) {
        callback(JSON.parse(this.response));
      }
    }
    else if (this.status != 0) {
      Log.error(this.name + " : POST receive status " + this.status);
    }
  });

  xhr.open("POST", url);
  xhr.setRequestHeader("content-type", "application/json");

  xhr.send(data);
}

function apiGet(url, apiKey, callback) {
  const data = null;

  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (this.status == 200) {
      if (this.readyState === this.DONE) {
        callback(JSON.parse(this.response));
      }
    }
    else if (this.status != 0) {
      Log.error(this.name + " : GET receive status " + this.status);
    }
  });

  xhr.open("GET", url);
  xhr.setRequestHeader("accept", "application/json");
  xhr.setRequestHeader("apikey", apiKey);

  xhr.send(data);
}


function checkHPHC(configHeuresCreuses, horloge) {
  let heureCreuse = false;
  configHeuresCreuses.forEach(heure => {
    if (new Date(horloge).getHours() >= heure.start && new Date(horloge).getHours() <= heure.end) {
      heureCreuse = true;
    }
  });
  return heureCreuse;
}

function parseIndex(configHeuresCreuses, moduleId, response) {
  let consoHC;
  let consoHP;
  let firstConsoHC;
  let firstConsoHP;
  let last60Minutes;
  let last24Hour;
  let instant = null;
  let trends = null;
  let consoPerHour = [];
  for (let index = 0; index < response.length; index++) {
    const element = response[index];
    if (index == 0) {
      consoHC = element.baseHchcEjphnBbrhcjb;
      consoHP = element.hchpEjphpmBbrhpjb;
      firstConsoHC = consoHC;
      firstConsoHP = consoHP;
      last60Minutes = new Date(new Date(element.horloge) - (60 * 60 * 1000)).toISOString();
      last24Hour = new Date(new Date(element.horloge) - (24 * 60 * 60 * 1000)).toISOString(); 
    }
    else {
      //last relative hour index found
      if (new Date(element.horloge) < new Date(last60Minutes)) {

        //get consumed watt
        consoHC -= element.baseHchcEjphnBbrhcjb;
        consoHP -= element.hchpEjphpmBbrhpjb;

        //get last hour conso
        if (instant == null) {
          instant = consoHC + consoHP;
        }
        else {
          //second relative hour, computed trends
          trends = instant - (consoHC + consoHP);
        }
        //save
        consoPerHour.push({ hour: new Date(element.horloge).getHours() + ":00", consoHC, consoHP });
        //reset for next hour
        last60Minutes = new Date(new Date(element.horloge) - (60 * 60 * 1000)).toISOString();
        consoHC = element.baseHchcEjphnBbrhcjb;
        consoHP = element.hchpEjphpmBbrhpjb;
      }
      //last relative hour index found
      if (new Date(element.horloge) < new Date(last24Hour)) {
        firstConsoHC -= element.baseHchcEjphnBbrhcjb;
        firstConsoHP -= element.hchpEjphpmBbrhpjb;
        last24Hour = {hp:firstConsoHP, hc:firstConsoHC};
      }
    }
  }
  consoPerHour = consoPerHour.reverse();

  return {
    moduleId,
    consoPerHour,
    instant,
    trends,
    lastIndex: response[0],
    hphcMode: checkHPHC(configHeuresCreuses, response[0].horloge)
  }
}

module.exports = NodeHelper.create({
  configHeuresCreuses: [],

  start: function () {
    Log.log("Starting node helper for: " + this.name);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === D2LApi.LAST_CURRENT_REQ) {
      apiGet(D2LApi.LAST_CURRENT_URL(payload.moduleId), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_CURRENT_RES, { moduleId: payload.moduleId, response: response });
      });
    }
    else if (notification === D2LApi.LAST_INDEX_REQ) {
      apiGet(D2LApi.LAST_INDEX_URL(payload.moduleId), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_INDEX_RES, { moduleId: payload.moduleId, response: response });
      });
    }
    else if (notification === D2LApi.LAST_INDEXES_REQ) {
      apiGet(D2LApi.LAST_INDEXES_URL(payload.moduleId, payload.nbHoursToFetch), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_INDEXES_RES, { moduleId: payload.moduleId, response: response });
      });
    }
    else if (notification === D2LApi.COMPTEUR_REQ) {
      apiGet(D2LApi.COMPTEUR_URL, payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.COMPTEUR_RES, response.idModule);
      });
    }
    else if (notification === D2LApi.APIKEY_REQ) {
      apiPost(D2LApi.APIKEY_URL, payload.login, payload.password, (response) => {
        this.sendSocketNotification(D2LApi.APIKEY_RES, response.apiKey);
      });
    }
    else if (notification === D2LApi.GET_DATA_REQ) {
      this.configHeuresCreuses = payload.configHeuresCreuses;
      apiPost(D2LApi.APIKEY_URL, payload.login, payload.password, (response) => {
        const apiKey = response.apiKey;
        apiGet(D2LApi.COMPTEUR_URL, apiKey, (response) => {
          response.forEach(compteur => {
            apiGet(D2LApi.LAST_INDEXES_URL(compteur.idModule, payload.nbHoursToFetch), apiKey, (response) => {
              this.sendSocketNotification(D2LApi.GET_DATA_RES, parseIndex(this.configHeuresCreuses, compteur.idModule, response));
            });
          });
        });
      });
    }
  },
});
