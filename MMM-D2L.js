// MMM-D2L.js

const svgGraphDown = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-graph-down-arrow" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 11.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 0-1 0v2.6l-3.613-4.417a.5.5 0 0 0-.74-.037L7.06 8.233 3.404 3.206a.5.5 0 0 0-.808.588l4 5.5a.5.5 0 0 0 .758.06l2.609-2.61L13.445 11H10.5a.5.5 0 0 0-.5.5Z" /></svg>'
const svgGraphUp = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-graph-up-arrow" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5Z"/></svg>'

Module.register("MMM-D2L", {
	// Default module config
	defaults: {
		updateInterval: 60000,
		login: "",
		password: "",
		nbHoursToFetch: 24,
		heuresCreuses: [
			{ start: 0, end: 6 },
			{ start: 11, end: 14 },
		],
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
		this.updateTimer = setInterval(() => this.fetchData(), this.config.updateInterval);
	},

	createUI: function (divWrapper, moduleId) {
		let title = document.createElement("div");
		title.setAttribute('id', 'linkyId' + moduleId);
		title.className = "title bright";
		title.innerText = "Linky"
		divWrapper.appendChild(title);

		table = document.createElement("table");
		table.className = "d2l-table";
		let content = document.createElement("tbody");

		let row = document.createElement("tr");
		row.className = "d2l-tr";
		let hc_name = document.createElement("td");
		let hc_index = document.createElement("td");
		hc_name.className = "d2l-name";
		hc_name.innerText = "HC"
		hc_name.setAttribute('id', 'hc-name' + moduleId);
		hc_index.className = "align-right bright";
		hc_index.setAttribute('id', 'HC' + moduleId);
		hc_index.innerText = "0"
		row.appendChild(hc_name);
		row.appendChild(hc_index);
		content.appendChild(row);

		row = document.createElement("tr");
		row.className = "d2l-tr";
		let hp_name = document.createElement("td");
		let hp_index = document.createElement("td");
		hp_name.className = "d2l-name";
		hp_name.innerText = "HP"
		hp_name.setAttribute('id', 'hp-name' + moduleId);
		hp_index.className = "align-right bright";
		hp_index.setAttribute('id', 'HP' + moduleId);
		hp_index.innerText = "0"
		row.appendChild(hp_name);
		row.appendChild(hp_index);
		content.appendChild(row);

		row = document.createElement("tr");
		row.className = "d2l-tr";
		let instant_name = document.createElement("td");
		let instant_index = document.createElement("td");
		instant_name.className = "d2l-name";
		instant_name.innerText = "Consomation dernière heure"
		instant_index.className = "align-right bright";
		instant_index.setAttribute('id', 'instant' + moduleId);
		instant_index.innerText = "0"
		row.appendChild(instant_name);
		row.appendChild(instant_index);
		content.appendChild(row);

		row = document.createElement("tr");
		row.className = "d2l-tr";
		let trends_name = document.createElement("td");
		let trends_index = document.createElement("td");
		trends_name.className = "d2l-name";
		trends_name.innerText = "Tendance de consomation"
		trends_index.className = "align-right bright";
		trends_index.setAttribute('id', 'trends' + moduleId);
		trends_index.innerHTML = svgGraphDown;
		row.appendChild(trends_name);
		row.appendChild(trends_index);
		content.appendChild(row);

		table.appendChild(content);
		divWrapper.appendChild(table);

		if (this.config.showChart == true) {
			let div = document.createElement("div");
			let chartConso = document.createElement("canvas");
			chartConso.setAttribute('style', 'margin-left: auto;');
			chartConso.setAttribute('id', 'chartConso' + moduleId);
			div.appendChild(chartConso);
			divWrapper.appendChild(div);
		}
	},

	getScripts: function () {
		return [
			"d2l.js",
			"https://cdn.jsdelivr.net/npm/chart.js"
		];
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
			let instant = payload.instant;
			let trends = payload.trends;
			let lastIndex = payload.lastIndex;
			let hphcMode = payload.hphcMode;
			this.updateChart(moduleId, consoPerHour, instant, trends, lastIndex, hphcMode);
			Log.info(`${this.name} : indexes received`);
		}
	},

	fetchData: function () {
		Log.info(`${this.name} : fetch data`);
		this.sendSocketNotification(D2LApi.GET_DATA_REQ,
			{
				login: this.config.login,
				password: this.config.password,
				configHeuresCreuses: this.config.heuresCreuses,
				nbHoursToFetch: this.config.nbHoursToFetch
			}
		);
	},

	updateChart: function (moduleId, consoPerHour, instant, trends, lastIndex, hphc) {

		if (document.getElementById('linkyId')) {
			//redefine id for all elements only for the first element
			document.getElementById('linkyId').setAttribute('id', 'linkyId' + moduleId);
			document.getElementById('hc-name').setAttribute('id', 'hc-name' + moduleId);
			document.getElementById('hp-name').setAttribute('id', 'hp-name' + moduleId);
			document.getElementById('HC').setAttribute('id', 'HC' + moduleId);
			document.getElementById('HP').setAttribute('id', 'HP' + moduleId);
			document.getElementById('instant').setAttribute('id', 'instant' + moduleId);
			document.getElementById('trends').setAttribute('id', 'trends' + moduleId);
			document.getElementById('chartConso').setAttribute('id', 'chartConso' + moduleId);
			if (this.config.showChart == true) {
				this.createChart(moduleId, consoPerHour);
			}
		}
		else if (document.getElementById('linkyId' + moduleId) === undefined) {
			//create new UI
			this.createUI(this.wrapper, moduleId);
		}

		if (hphc) {
			document.getElementById('hc-name' + moduleId).className = "d2l-name bright";
			document.getElementById('hp-name' + moduleId).className = "d2l-name";
			document.getElementById('HP' + moduleId).innerHTML = lastIndex.hchpEjphpmBbrhpjb / 1000 + " kWh";
			document.getElementById('HC' + moduleId).innerHTML = "<b>" + lastIndex.baseHchcEjphnBbrhcjb / 1000 + " kWh" + "</b>";
			document.getElementById('hp-name' + moduleId).innerHTML = "HP";
			document.getElementById('hc-name' + moduleId).innerHTML = "<b>HC</b>";
		}
		else {
			document.getElementById('hc-name' + moduleId).className = "d2l-name";
			document.getElementById('hp-name' + moduleId).className = "d2l-name bright";
			document.getElementById('HP' + moduleId).innerHTML = "<b>" + lastIndex.hchpEjphpmBbrhpjb / 1000 + " kWh" + "</b>";
			document.getElementById('HC' + moduleId).innerHTML = lastIndex.baseHchcEjphnBbrhcjb / 1000 + " kWh";
			document.getElementById('hp-name' + moduleId).innerHTML = "<b>HP</b>";
			document.getElementById('hc-name' + moduleId).innerHTML = "HC";
		}
		document.getElementById('instant' + moduleId).innerHTML = parseFloat(instant).toString() + " W";
		if (this.config.showCompteurId) {
			document.getElementById('linkyId' + moduleId).innerHTML = "Linky : " + moduleId;
		}
		if (trends < 0) {
			document.getElementById('trends' + moduleId).innerHTML = '<div class="bright">' + trends + 'W </div>' + svgGraphDown;
			document.getElementById('trends' + moduleId).setAttribute('style', 'color: #198754');
		}
		else {
			document.getElementById('trends' + moduleId).innerHTML = '<div class="bright">+' + trends + 'W </div>' + svgGraphUp;
			document.getElementById('trends' + moduleId).setAttribute('style', 'color: #dc3545');
		}

		if (this.config.showChart == true) {
			this.updateData(
				moduleId,
				consoPerHour.map(({ hour }) => hour),
				[
					consoPerHour.map(({ consoHC }) => consoHC),
					consoPerHour.map(({ consoHP }) => consoHP)
				]
			);
		}
	},

	updateData: function (chartId, label, data) {
		this.charts.forEach(chart => {
			if (chart.moduleId == chartId) {
				chart.chart.data.labels = label;
				chart.chart.data.datasets[0].data = data[0];
				chart.chart.data.datasets[1].data = data[1];
				chart.chart.update();
			}
		});
	},

	createChart: function (moduleId, consoPerHour) {
		Chart.defaults.color = 'lightgrey';
		this.charts.push({
			moduleId, chart: new Chart(document.getElementById('chartConso' + moduleId), {
				type: 'bar',
				data: {
					labels: consoPerHour.map(({ hour }) => hour),
					datasets: [
						{
							label: 'HC',
							data: consoPerHour.map(({ consoHC }) => consoHC),
							borderWidth: 2,
						},
						{
							label: 'HP',
							data: consoPerHour.map(({ consoHP }) => consoHP),
							borderWidth: 2,
						},
					]
				},
				options: {
					maintainAspectRatio: true,
					scales: {
						x: {
							ticks: {
								color: 'lightgrey'
							},
							border:
							{
								color: 'lightgrey',
							},
							grid: {
								color: 'lightgrey',
								borderColor: 'lightgrey'
							}
						},
						y: {
							min: 0,
							max: this.config.contract,
							ticks: {
								color: 'lightgrey'
							},
							border:
							{
								color: 'lightgrey',
							},
							grid: {
								color: 'lightgrey',
								borderColor: 'lightgrey'
							}
						},
					},
				}
			})
		});
	},
});
