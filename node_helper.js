"use strict";

const NodeHelper = require("node_helper");
const XMLHttpRequest = require("xhr2");
const Log = require("logger");
const { D2LApi } = require("./d2l");

function apiPost(url, login, password, callback) {
	const data = JSON.stringify({
		login: login,
		password: password,
	});

	const xhr = new XMLHttpRequest();
	xhr.addEventListener("readystatechange", function () {
		if (this.status == 200) {
			if (this.readyState === this.DONE) {
				callback(JSON.parse(this.response));
			}
		} else if (this.status != 0) {
			Log.log(this.name + " : POST receive status " + this.status);
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
		} else if (this.status != 0) {
			Log.log(this.name + " : GET receive status " + this.status);
		}
	});

	xhr.open("GET", url);
	xhr.setRequestHeader("accept", "application/json");
	xhr.setRequestHeader("apikey", apiKey);

	xhr.send(data);
}

function checkHPHC(configHeuresCreuses, horloge) {
	let heureCreuse = false;
	configHeuresCreuses.forEach((heure) => {
		if (
			new Date(horloge).getHours() >= heure.start &&
			new Date(horloge).getHours() <= heure.end
		) {
			heureCreuse = true;
		}
	});
	return heureCreuse;
}

function parseIndex(priceHPHC, configHeuresCreuses, moduleId, response) {
	let consoPerHour = [];
	let conso = {instant:0,j1:0,j2:0,j3:0};
	let price = {instant:0,j1:0,j2:0,j3:0};


	let currentDate;
	let to;
	let from;

	currentDate = new Date(
		new Date().getFullYear(),
		new Date().getMonth(),
		new Date().getDate()
	).toISOString();

	
	let currentTimeDay = new Date(
		new Date(response[0].horloge).getFullYear(),
		new Date(response[0].horloge).getMonth(),
		new Date(response[0].horloge).getDate(),
		new Date(response[0].horloge).getHours(),
	).toISOString();

	to = new Date(
		new Date(currentDate) 
		- 24 * 60 * 60 * 1000 
	).toISOString();
	
	from = new Date(
		new Date(currentDate) 
		- 2 * 24 * 60 * 60 * 1000 
	).toISOString();

	let last60Minutes = new Date(new Date(response[0].horloge) - (60 * 60 * 1000)).toISOString();
	let tempConso = {hp:0,hc:0};

	for (let index = 0; index < response.length; index++) {
		const element = response[index];

		if(index === 0)
		{
			tempConso.hc = element.baseHchcEjphnBbrhcjb;
			tempConso.hp = element.hchpEjphpmBbrhpjb;
		}
		//get instant conso
		if (new Date(element.horloge) <= new Date(last60Minutes))
		{
			if(conso.instant == 0)
			{
				conso.instant = response[0].baseHchcEjphnBbrhcjb - element.baseHchcEjphnBbrhcjb + response[0].hchpEjphpmBbrhpjb - element.hchpEjphpmBbrhpjb;
				price.instant = priceHPHC.hc * (response[0].baseHchcEjphnBbrhcjb - element.baseHchcEjphnBbrhcjb)/1000 + priceHPHC.hp * (response[0].hchpEjphpmBbrhpjb - element.hchpEjphpmBbrhpjb)/1000;	
			}
		}

		//get day current day conso
		if (new Date(element.horloge) <= new Date(currentTimeDay)
		 && (new Date(element.horloge).getDate() == new Date(currentDate).getDate() ) ) {			
			//save
			consoPerHour.push({
				hour: new Date(currentTimeDay).getHours() + ":00",
				consoHC : tempConso.hc - element.baseHchcEjphnBbrhcjb,
				consoHP : tempConso.hp - element.hchpEjphpmBbrhpjb,
			});
			//reset for next hour
			tempConso.hc = element.baseHchcEjphnBbrhcjb;
			tempConso.hp = element.hchpEjphpmBbrhpjb;
			//minus one hour
			currentTimeDay = new Date(new Date(currentTimeDay) - 60 * 60 * 1000).toISOString();
		}

		//get j - x conso
		else if ((new Date(element.horloge) < new Date(to)) 
			&& (new Date(element.horloge) >= new Date(from))) {

			if(conso.j1 == 0)
			{
				conso.j1 = tempConso.hc - element.baseHchcEjphnBbrhcjb + tempConso.hp - element.hchpEjphpmBbrhpjb;
				price.j1 = priceHPHC.hc * (tempConso.hc - element.baseHchcEjphnBbrhcjb) / 1000 + priceHPHC.hp * (tempConso.hp - element.hchpEjphpmBbrhpjb) / 1000;
			}
			else if(conso.j2 == 0)
			{
				conso.j2 = tempConso.hc - element.baseHchcEjphnBbrhcjb + tempConso.hp - element.hchpEjphpmBbrhpjb;
				price.j2 = priceHPHC.hc * (tempConso.hc - element.baseHchcEjphnBbrhcjb) / 1000 + priceHPHC.hp * (tempConso.hp - element.hchpEjphpmBbrhpjb) / 1000;
			}
			else if(conso.j3 == 0)
			{
				conso.j3 = tempConso.hc - element.baseHchcEjphnBbrhcjb + tempConso.hp - element.hchpEjphpmBbrhpjb;
				price.j3 = priceHPHC.hc * (tempConso.hc - element.baseHchcEjphnBbrhcjb) / 1000 + priceHPHC.hp * (tempConso.hp - element.hchpEjphpmBbrhpjb) / 1000;
			}

			tempConso.hc = element.baseHchcEjphnBbrhcjb;
			tempConso.hp = element.hchpEjphpmBbrhpjb;
			to = from
			from = new Date(
				new Date(to) 
				- 24 * 60 * 60 * 1000 
			).toISOString();
		}
	}

	consoPerHour = consoPerHour.reverse();
	//fill 24 h
	for (let index = 0; index < 24; index++) {
		if(consoPerHour[index] === undefined)
		{
			consoPerHour.splice(index,0,{
				hour: index + ":00",
				consoHC : 0,
				consoHP : 0,
			});
		}
	}

	return {
		moduleId,
		consoPerHour,
		conso,
		price,
		lastIndex: response[0],
		hphcMode: checkHPHC(configHeuresCreuses, response[0].horloge),
	};
}

module.exports = NodeHelper.create({

	start: function () {
		Log.log("Starting node helper for: " + this.name);
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === D2LApi.LAST_CURRENT_REQ) {
			apiGet(
				D2LApi.LAST_CURRENT_URL(payload.moduleId),
				payload.apiKey,
				(response) => {
					this.sendSocketNotification(D2LApi.LAST_CURRENT_RES, {
						moduleId: payload.moduleId,
						response: response,
					});
				}
			);
		} else if (notification === D2LApi.LAST_INDEX_REQ) {
			apiGet(
				D2LApi.LAST_INDEX_URL(payload.moduleId),
				payload.apiKey,
				(response) => {
					this.sendSocketNotification(D2LApi.LAST_INDEX_RES, {
						moduleId: payload.moduleId,
						response: response,
					});
				}
			);
		} else if (notification === D2LApi.LAST_INDEXES_REQ) {
			apiGet(
				D2LApi.LAST_INDEXES_URL(
					payload.moduleId,
					payload.nbHoursToFetch
				),
				payload.apiKey,
				(response) => {
					this.sendSocketNotification(D2LApi.LAST_INDEXES_RES, {
						moduleId: payload.moduleId,
						response: response,
					});
				}
			);
		} else if (notification === D2LApi.COMPTEUR_REQ) {
			apiGet(D2LApi.COMPTEUR_URL, payload.apiKey, (response) => {
				this.sendSocketNotification(
					D2LApi.COMPTEUR_RES,
					response.idModule
				);
			});
		} else if (notification === D2LApi.APIKEY_REQ) {
			apiPost(
				D2LApi.APIKEY_URL,
				payload.login,
				payload.password,
				(response) => {
					this.sendSocketNotification(
						D2LApi.APIKEY_RES,
						response.apiKey
					);
				}
			);
		} else if (notification === D2LApi.GET_DATA_REQ) {
			apiPost(
				D2LApi.APIKEY_URL,
				payload.login,
				payload.password,
				(response) => {
					const apiKey = response.apiKey;
					apiGet(D2LApi.COMPTEUR_URL, apiKey, (response) => {
						response.forEach((compteur) => {
							apiGet(
								D2LApi.LAST_INDEXES_URL(
									compteur.idModule,
									payload.nbHoursToFetch + new Date().getHours()
								),
								apiKey,
								(response) => {
									this.sendSocketNotification(
										D2LApi.GET_DATA_RES,
										parseIndex(
											payload.price,
											payload.configHeuresCreuses,
											compteur.idModule,
											response
										)
									);
								}
							);
						});
					});
				}
			);
		}
	},
});
