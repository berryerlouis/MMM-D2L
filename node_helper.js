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

function parseIndex(configHeuresCreuses, compteurId, response) {
  let hc;
  let hp;
  let last60Minutes;
  let instant = null;
  let trends = null;
  let consoPerHour = [];
  for (let index = 0; index < response.length; index++) {
    const element = response[index];
    if (index == 0) {
      hc = element.baseHchcEjphnBbrhcjb;
      hp = element.hchpEjphpmBbrhpjb;
      last60Minutes = new Date(new Date(element.horloge) - (60 * 60 * 1000)).toISOString();
    }
    else {
      //last relative hour index found
      if (new Date(element.horloge) < new Date(last60Minutes)) {
        if (instant == null) {
          instant = hc - element.baseHchcEjphnBbrhcjb + hp - element.hchpEjphpmBbrhpjb;
        }
        else{
          //second relative hour, computed trends
          trends = instant - (hc - element.baseHchcEjphnBbrhcjb + hp - element.hchpEjphpmBbrhpjb);
        }
        //get consumed watt
        hc -= element.baseHchcEjphnBbrhcjb;
        hp -= element.hchpEjphpmBbrhpjb;
        //save
        consoPerHour.push({ hour: new Date(element.horloge).getHours() + ":00", hc, hp });
        //reset for next hour
        last60Minutes = new Date(new Date(element.horloge) - (60 * 60 * 1000)).toISOString();
        hc = element.baseHchcEjphnBbrhcjb;
        hp = element.hchpEjphpmBbrhpjb;
      }
    }
  }
  consoPerHour = consoPerHour.reverse();

  return {
    compteurId,
    consoPerHour,
    instant,
    trends,
    lastIndex: response[0],
    hphcMode: checkHPHC(configHeuresCreuses, response[0].horloge)
  }
}

module.exports = NodeHelper.create({
  apiKey: "",
  compteurId: "",
  configHeuresCreuses: [],

  start: function () {
    Log.log("Starting node helper for: " + this.name);
  },

  socketNotificationReceived: function (notification, payload) {
    Log.log(this.name + " : " + notification);
    if (notification === D2LApi.LAST_CURRENT_REQ) {
      apiGet(D2LApi.LAST_CURRENT_URL(payload.compteurId), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_CURRENT_RES, { compteurId: payload.compteurId, response: response });
      });
    }
    else if (notification === D2LApi.LAST_INDEX_REQ) {
      apiGet(D2LApi.LAST_INDEX_URL(payload.compteurId), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_INDEX_RES, { compteurId: payload.compteurId, response: response });
      });
    }
    else if (notification === D2LApi.LAST_INDEXES_REQ) {
      apiGet(D2LApi.LAST_INDEXES_URL(payload.compteurId, payload.nbHoursToFetch), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_INDEXES_RES, { compteurId: payload.compteurId, response: response });
      });
    }
    else if (notification === D2LApi.COMPTEUR_REQ) {
      apiGet(D2LApi.COMPTEUR_URL, payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.COMPTEUR_RES, response);
      });
    }
    else if (notification === D2LApi.APIKEY_REQ) {
      apiPost(D2LApi.APIKEY_URL, payload.login, payload.password, (response) => {
        this.sendSocketNotification(D2LApi.APIKEY_RES, response);
      });
    }
    else if (notification === D2LApi.GET_DATA_REQ) {
      this.configHeuresCreuses = payload.configHeuresCreuses;
      apiPost(D2LApi.APIKEY_URL, payload.login, payload.password, (response) => {
        this.apiKey = response.apiKey;
        apiGet(D2LApi.COMPTEUR_URL, this.apiKey, (response) => {
          this.compteurId = response[0].idModule;
          apiGet(D2LApi.LAST_INDEXES_URL(this.compteurId, payload.nbHoursToFetch), this.apiKey, (response) => {
            this.sendSocketNotification(D2LApi.GET_DATA_RES, parseIndex(this.configHeuresCreuses, this.compteurId, response));
          });
        });
      });
    }
  },
});
