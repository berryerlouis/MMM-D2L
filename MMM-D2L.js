// MMM-D2L.js

const svgGraphDown =
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-graph-down-arrow" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 11.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-1 0v2.6l-3.613-4.417a.5.5 0 0 0-.74-.037L7.06 8.233 3.404 3.206a.5.5 0 0 0-.808.588l4 5.5a.5.5 0 0 0 .758.06l2.609-2.61L13.445 11H10.5a.5.5 0 0 0-.5.5Z" /></svg>';
const svgGraphUp =
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-graph-up-arrow" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5Z"/></svg>';

Module.register("MMM-D2L", {
	// Default module config
	defaults: {
		updateInterval: 60000,
		login: "",
		password: "",
		heuresCreuses: [
			{ start: 1, end: 7 },
			{ start: 11, end: 13 },
		],
		price: {
			hc: 0.147,
			hp: 0.1841,
		},
		currency: "€",
		contract: 6000,
		showCompteurId: false,
	},
	charts: [],

	getStyles: function () {
		return ["MMM-D2L.css"];
	},

	start: function () {
		//create dom lastIndexes
		this.wrapper = document.createElement("div");
		this.createUI(this.wrapper, "");
		Log.info(`Starting module: ${this.name}`);
		this.fetchData();
		this.updateTimer = setInterval(
			() => this.fetchData(),
			this.config.updateInterval
		);
	},

	createUI: function (divWrapper, moduleId) {
		divWrapper.innerHTML +=
			`
		<div id="linkyId" class="title">Linky</div>
		<table class="d2l-table">
		  <tbody>
			<tr>
			  <td class="d2l-name" id="hc-name" colspan="2">HC</td>
			  <td class="d2l-value" id="HC` + moduleId + `"></td>
			</tr>
			<tr>
			  <td class="d2l-name" id="hp-name" colspan="2"><b>HP</b></td>
			  <td class="d2l-value" id="HP` + moduleId + `"></td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour</td>
			  <td class="d2l-value" id="conso-j-0` + moduleId + `">0 W</td>
			  <td class="d2l-value" id="price-j-0` + moduleId + `">0 ` + this.config.currency + `</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-1</td>
			  <td class="d2l-value" id="conso-j-1` + moduleId + `">0 W</td>
			  <td class="d2l-value" id="price-j-1` + moduleId + `">0 ` + this.config.currency + `</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-2</td>
			  <td class="d2l-value" id="conso-j-2` + moduleId + `">0 W</td>
			  <td class="d2l-value" id="price-j-2` + moduleId + `">0 ` + this.config.currency + `</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-3</td>
			  <td class="d2l-value" id="conso-j-3` + moduleId + `">0 W</td>
			  <td class="d2l-value" id="price-j-3` + moduleId + `">0 ` + this.config.currency + `</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-4</td>
			  <td class="d2l-value" id="conso-j-4` + moduleId + `">0 W</td>
			  <td class="d2l-value" id="price-j-4` + moduleId + `">0 ` + this.config.currency + `</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-5</td>
			  <td class="d2l-value" id="conso-j-5` + moduleId + `">0 W</td>
			  <td class="d2l-value" id="price-j-5` + moduleId + `">0 ` + this.config.currency + `</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-6</td>
			  <td class="d2l-value" id="conso-j-6` + moduleId + `">0 W</td>
			  <td class="d2l-value" id="price-j-6` + moduleId + `">0 ` + this.config.currency + `</td>
			</tr>
		  </tbody>
		</table>`;
	},

	getScripts: function () {
		return ["d2l.js", "https://cdn.jsdelivr.net/npm/chart.js"];
	},

	getDom: function () {
		return this.wrapper;
	},

	notificationReceived: function (notification, payload, sender) {
		if (notification === "UPDATE_D2L") {
			this.fetchData();
		}
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification === D2LApi.GET_DATA_RES) {
			let moduleId = payload.moduleId;
			let conso = payload.conso;
			let price = payload.price;
			let lastIndex = payload.lastIndex;
			let hphcMode = payload.hphcMode;
			this.updateUI(
				moduleId,
				conso,
				price,
				lastIndex,
				hphcMode
			);
		}
	},

	fetchData: function () {
		Log.info(`${this.name} : fetch data`);
		this.sendSocketNotification(D2LApi.GET_DATA_REQ, {
			login: this.config.login,
			password: this.config.password,
			configHeuresCreuses: this.config.heuresCreuses,
			nbHoursToFetch: 24 * 7,
			price:this.config.price
		});
	},

	updateUI: function (
		moduleId,
		conso,
		price,
		lastIndex,
		hphc
	) {
		if (document.getElementById("linkyId")) {
			//redefine id for all elements only for the first element
			document.getElementById("linkyId").setAttribute("id", "linkyId" + moduleId);
			document.getElementById("hc-name").setAttribute("id", "hc-name" + moduleId);
			document.getElementById("hp-name").setAttribute("id", "hp-name" + moduleId);
			document.getElementById("HC").setAttribute("id", "HC" + moduleId);
			document.getElementById("HP").setAttribute("id", "HP" + moduleId);
			for (let index = 0; index < 7; index++) {
				document.getElementById("conso-j-" + index.toString()).setAttribute("id", "conso-j-" + index.toString() + moduleId);
				document.getElementById("price-j-" + index.toString()).setAttribute("id", "price-j-" + index.toString() + moduleId);
			}
		} else if (
			document.getElementById("linkyId" + moduleId) === undefined
		) {
			//create new UI
			this.createUI(this.wrapper, moduleId);
		}

		if (hphc) {
			document.getElementById("HP" + moduleId).innerHTML = lastIndex.hchpEjphpmBbrhpjb / 1000 + " kWh";
			document.getElementById("HC" + moduleId).innerHTML = "<b>" + lastIndex.baseHchcEjphnBbrhcjb / 1000 + " kWh" + "</b>";
			document.getElementById("hp-name" + moduleId).innerHTML = "HP";
			document.getElementById("hc-name" + moduleId).innerHTML = "<b>HC</b>";
		} else {
			document.getElementById("HP" + moduleId).innerHTML = "<b>" + lastIndex.hchpEjphpmBbrhpjb / 1000 + " kWh" + "</b>";
			document.getElementById("HC" + moduleId).innerHTML = lastIndex.baseHchcEjphnBbrhcjb / 1000 + " kWh";
			document.getElementById("hp-name" + moduleId).innerHTML = "<b>HP</b>";
			document.getElementById("hc-name" + moduleId).innerHTML = "HC";
		}
		for (let index = 0; index < 7; index++) {
			document.getElementById("conso-j-" + index.toString() + moduleId).innerHTML = parseFloat(conso[index]).toString() + " W" ;
			document.getElementById("price-j-" + index.toString() + moduleId).innerHTML = parseFloat(price[index]).toFixed(4) + " " + this.config.currency;
		}

		if (this.config.showCompteurId) {
			document.getElementById("linkyId" + moduleId).innerHTML =
				"Linky : " + moduleId;
		}
	},
});
