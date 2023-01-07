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
		showChart: true,
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
		divWrapper =
			`
		<div id="linkyId" class="title">Linky</div>
		<table class="d2l-table">
		  <tbody>
			<tr>
			  <td class="d2l-name" id="hc-name">HC</td>
			  <td class="d2l-value" id="HC` +
			moduleId +
			`" colspan="2"></td>
			</tr>
			<tr>
			  <td class="d2l-name" id="hp-name"><b>HP</b></td>
			  <td class="d2l-value" id="HP` +
			moduleId +
			`" colspan="2"></td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso instantannée</td>
			  <td class="d2l-value" id="conso-instant` +
			moduleId +
			`">W</td>
			  <td class="d2l-value" id="price-instant` +
			moduleId +
			`">` +
			this.config.currency +
			`</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-1</td>
			  <td class="d2l-value" id="conso-j-1` +
			moduleId +
			`">W</td>
			  <td class="d2l-value" id="price-j-1` +
			moduleId +
			`">` +
			this.config.currency +
			`</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-2</td>
			  <td class="d2l-value" id="conso-j-2` +
			moduleId +
			`">W</td>
			  <td class="d2l-value" id="price-j-2` +
			moduleId +
			`">` +
			this.config.currency +
			`</td>
			</tr>
			<tr>
			  <td class="d2l-name">Conso Jour-3</td>
			  <td class="d2l-value" id="conso-j-3` +
			moduleId +
			`">W</td>
			  <td class="d2l-value" id="price-j-3` +
			moduleId +
			`">` +
			this.config.currency +
			`</td>
			</tr>
		  </tbody>
		</table>`;

		if (this.config.showChart == true) {
			divWrapper +=
				`<canvas class="d2l-chart" id="chartConso` +
				moduleId +
				`"></canvas>`;
		}
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
			let consoPerHour = payload.consoPerHour;
			let conso = payload.conso;
			let price = payload.price;
			let lastIndex = payload.lastIndex;
			let hphcMode = payload.hphcMode;
			this.updateChart(
				moduleId,
				consoPerHour,
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
			nbHoursToFetch: 24 * 3,
		});
	},

	updateChart: function (
		moduleId,
		consoPerHour,
		conso,
		price,
		lastIndex,
		hphc
	) {
		if (document.getElementById("linkyId")) {
			//redefine id for all elements only for the first element
			document
				.getElementById("linkyId")
				.setAttribute("id", "linkyId" + moduleId);
			document
				.getElementById("hc-name")
				.setAttribute("id", "hc-name" + moduleId);
			document
				.getElementById("hp-name")
				.setAttribute("id", "hp-name" + moduleId);
			document.getElementById("HC").setAttribute("id", "HC" + moduleId);
			document.getElementById("HP").setAttribute("id", "HP" + moduleId);
			document
				.getElementById("conso-instant")
				.setAttribute("id", "conso-instant" + moduleId);
			document
				.getElementById("price-instant")
				.setAttribute("id", "price-instant" + moduleId);
			document
				.getElementById("conso-j-1")
				.setAttribute("id", "conso-j-1" + moduleId);
			document
				.getElementById("price-j-1")
				.setAttribute("id", "price-j-1" + moduleId);
			document
				.getElementById("conso-j-2")
				.setAttribute("id", "conso-j-2" + moduleId);
			document
				.getElementById("price-j-2")
				.setAttribute("id", "price-j-2" + moduleId);
			document
				.getElementById("conso-j-3")
				.setAttribute("id", "conso-j-3" + moduleId);
			document
				.getElementById("price-j-3")
				.setAttribute("id", "price-j-3" + moduleId);
			if (this.config.showChart == true) {
				this.createChart(moduleId, consoPerHour);
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

		document.getElementById("conso-instant" + moduleId).innerHTML = parseFloat(conso.instant).toString() + " W" ;
		document.getElementById("price-instant" + moduleId).innerHTML = parseFloat(price.instant).toString() + " " + this.config.currency;
		document.getElementById("conso-j-1" + moduleId).innerHTML = parseFloat(conso.j1).toString() + " W" ;
		document.getElementById("price-j-1" + moduleId).innerHTML = parseFloat(price.j1).toString() + " " + this.config.currency;
		document.getElementById("conso-j-2" + moduleId).innerHTML = parseFloat(conso.j2).toString() + " W" ;
		document.getElementById("price-j-2" + moduleId).innerHTML = parseFloat(price.j2).toString() + " " + this.config.currency;
		document.getElementById("conso-j-3" + moduleId).innerHTML = parseFloat(conso.j3).toString() + " W" ;
		document.getElementById("price-j-3" + moduleId).innerHTML = parseFloat(price.j3).toString() + " " + this.config.currency;

		if (this.config.showCompteurId) {
			document.getElementById("linkyId" + moduleId).innerHTML =
				"Linky : " + moduleId;
		}

		if (this.config.showChart == true) {
			this.updateData(
				moduleId,
				consoPerHour.map(({ hour }) => hour),
				[
					consoPerHour.map(({ consoHC }) => consoHC),
					consoPerHour.map(({ consoHP }) => consoHP),
				]
			);
		}
	},

	updateData: function (chartId, label, data) {
		this.charts.forEach((chart) => {
			if (chart.moduleId == chartId) {
				chart.chart.data.labels = label;
				chart.chart.data.datasets[0].data = data[0];
				chart.chart.data.datasets[1].data = data[1];
				chart.chart.update();
			}
		});
	},

	createChart: function (moduleId, consoPerHour) {
		Chart.defaults.color = "lightgrey";
		this.charts.push({
			moduleId,
			chart: new Chart(document.getElementById("chartConso" + moduleId), {
				type: "bar",
				data: {
					labels: consoPerHour.map(({ hour }) => hour),
					datasets: [
						{
							label: "HC",
							data: consoPerHour.map(({ consoHC }) => consoHC),
							borderWidth: 2,
						},
						{
							label: "HP",
							data: consoPerHour.map(({ consoHP }) => consoHP),
							borderWidth: 2,
						},
					],
				},
				options: {
					maintainAspectRatio: true,
					scales: {
						x: {
							ticks: {
								color: "lightgrey",
							},
							border: {
								color: "lightgrey",
							},
							grid: {
								color: "lightgrey",
								borderColor: "lightgrey",
							},
						},
						y: {
							min: 0,
							max: this.config.contract,
							ticks: {
								color: "lightgrey",
								stepSize: 1000
							},
							border: {
								color: "lightgrey",
							},
							grid: {
								color: "lightgrey",
								borderColor: "lightgrey",
							},
						},
					},
				},
			}),
		});
	},
});
