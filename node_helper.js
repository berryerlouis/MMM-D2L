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

	let price = []
	let conso = []
	let tempConso = 
		{
			hc:response[0].baseHchcEjphnBbrhcjb,
			hp:response[0].hchpEjphpmBbrhpjb
		};
	let from = new Date(
		new Date(response[0].horloge).getFullYear(),
		new Date(response[0].horloge).getMonth(),
		new Date(response[0].horloge).getDate(),
		1,
		0,
		0
	).toISOString();

	for (let index = 0; index < response.length; index++) {
		const element = response[index];

		//get day conso
		if ((new Date(element.horloge) <= new Date(from))
		) {
			conso.push(tempConso.hc - element.baseHchcEjphnBbrhcjb + tempConso.hp - element.hchpEjphpmBbrhpjb);
			price.push(priceHPHC.hc * ((tempConso.hc - element.baseHchcEjphnBbrhcjb) / 1000) + priceHPHC.hp * ((tempConso.hp - element.hchpEjphpmBbrhpjb) / 1000));
			tempConso.hc = element.baseHchcEjphnBbrhcjb;
			tempConso.hp = element.hchpEjphpmBbrhpjb;
			from = new Date(
				new Date(from) 
				- 24 * 60 * 60 * 1000 
			).toISOString();
		}
	}

	return {
		moduleId,
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
