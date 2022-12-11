"use strict";

const NodeHelper = require("node_helper");
const XMLHttpRequest = require('xhr2');
const Log = require("logger");
const {D2LApi} = require("./d2l");


function apiPost(url, login, password, callback) {
  const data = JSON.stringify({
    "login": login,
    "password": password
  });

  const xhr = new XMLHttpRequest();
  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === this.DONE) {
      callback(JSON.parse(this.response));
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
    if (this.readyState === this.DONE) {
      callback(JSON.parse(this.response));
    }
  });

  xhr.open("GET", url);
  xhr.setRequestHeader("accept", "application/json");
  xhr.setRequestHeader("apikey", apiKey);

  xhr.send(data);
}


function checkHPHC(horloge)
{
  let heureCreuse = false;
  this.config.heuresCreuses.forEach(heure => {
    if(new Date(horloge).getHours() >= heure.start && new Date(horloge).getHours() <= heure.end)
    {
      heureCreuse = true;
    }
  });
  return heureCreuse;
}

function parseIndex(response)
{
  let hc;
  let hp;
  let last60Minutes;
  let instant;
  let moyPerHour = [];
  for (let index = 0; index < response.length; index++) 
  {
    const element = response[index];
    if(index == 0)
    {
      hc = element.baseHchcEjphnBbrhcjb;
      hp = element.hchpEjphpmBbrhpjb;
      last60Minutes = new Date(new Date(element.horloge) - (60 * 60 * 1000)).toISOString();
    }
    else
    {
      //last hour index found
      if(new Date(element.horloge) < new Date(last60Minutes))
      {
        instant = (checkHPHC(element.horloge) ? hc : hp) - (checkHPHC(element.horloge) ? element.baseHchcEjphnBbrhcjb : element.hchpEjphpmBbrhpjb);
      
        //get consumed watt
        hc -= element.baseHchcEjphnBbrhcjb;
        hp -= element.hchpEjphpmBbrhpjb;
        //save
        moyPerHour.push({hour : new Date(element.horloge).getHours() + ":00", hc,hp});
        //reset for next hour
        last60Minutes = new Date(new Date(element.horloge) - (60 * 60 * 1000)).toISOString();
        hc = element.baseHchcEjphnBbrhcjb;
        hp = element.hchpEjphpmBbrhpjb;
      }
    }
  }
  moyPerHour = moyPerHour.reverse();
  return {moyPerHour, instant, lastIndex:response[0], hphc:checkHPHC(response[0].horloge) }
} 

module.exports = NodeHelper.create({
  apiKey: "",
  compteurId: "",
  moyPerHour:[],

  start: function () {
    Log.log("Starting node helper for: " + this.name);
  },

  socketNotificationReceived: function (notification, payload) {
    Log.log(this.name + " : " + notification);
    if (notification === D2LApi.LAST_CURRENT_REQ) {
      apiGet(D2LApi.LAST_CURRENT_URL(payload.compteurId), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_CURRENT_RES, { compteurId:payload.compteurId, response:response } );
      });
    }
    else if (notification === D2LApi.LAST_INDEX_REQ) {
      apiGet(D2LApi.LAST_INDEX_URL(payload.compteurId), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_INDEX_RES, { compteurId:payload.compteurId, response:response } );
      });
    }
    else if (notification === D2LApi.LAST_INDEXES_REQ)
    {
      apiGet(D2LApi.LAST_INDEXES_URL( payload.compteurId,payload.nbHoursToFetch), payload.apiKey, (response) => {
        this.sendSocketNotification(D2LApi.LAST_INDEXES_RES, { compteurId:payload.compteurId, response:response } );
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
      apiPost(D2LApi.APIKEY_URL, payload.login, payload.password, (response) => {
        this.apiKey = response.apiKey;
        apiGet(D2LApi.COMPTEUR_URL, this.apiKey, (response) => {
          this.compteurId = response[0].idModule;
          apiGet(D2LApi.LAST_INDEXES_URL( this.compteurId, payload.nbHoursToFetch), this.apiKey, (response) => {
            this.sendSocketNotification(D2LApi.GET_DATA_RES, parseIndex(response));
          });
        });
      });
    }
  },
});
