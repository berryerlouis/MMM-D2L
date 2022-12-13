// MMM-D2L.js

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
		showChart: true,
	},
	chart: undefined,

	getStyles: function () {
		return ["MMM-D2L.css"];
	},

	start: function () {
		//create dom lastIndexs
		this.wrapper = document.createElement("div");
		let title = document.createElement("div");
		title.className = "title";
		title.innerText = "Linky"
		this.wrapper.appendChild(title);

		table = document.createElement("table");
		table.className = "d2l-table";
		let content = document.createElement("tbody");

		let row = document.createElement("tr");
		row.className = "d2l-tr";
		let hc_name = document.createElement("td");
		let hc_index = document.createElement("td");
		hc_name.className = "d2l-name";
		hc_name.innerText = "HC"
		hc_name.setAttribute('id', 'HC-name');
		hc_index.className = "align-right bright";
		hc_index.setAttribute('id', 'HC');
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
		hp_name.setAttribute('id', 'HP-name');
		hp_index.className = "align-right bright";
		hp_index.setAttribute('id', 'HP');
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
		instant_index.setAttribute('id', 'instant');
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
		trends_index.setAttribute('id', 'trends');
		trends_index.innerText = "0"
		row.appendChild(trends_name);
		row.appendChild(trends_index);
		content.appendChild(row);

		table.appendChild(content);
		this.wrapper.appendChild(table);

		if (this.config.showChart == true) {
			let div = document.createElement("div");
			let myChart = document.createElement("canvas");
			myChart.setAttribute('style', 'margin-left: auto;');
			myChart.setAttribute('id', 'myChart');
			div.appendChild(myChart);
			this.wrapper.appendChild(div);
		}

		Log.info(`Starting module: ${this.name}`);
		this.fetchData();
		this.updateTimer = setInterval(() => this.fetchData(), this.config.updateInterval);
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
			let compteurId = payload.compteurId;
			let consoPerHour = payload.consoPerHour;
			let instant = payload.instant;
			let trends = payload.trends;
			let lastIndex = payload.lastIndex;
			let hphcMode = payload.hphcMode;
			this.updateChart(compteurId, consoPerHour, instant, trends, lastIndex, hphcMode);
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

	updateChart: function (compteurId, consoPerHour, instant, trends, lastIndex, hphc) {
		if (hphc) {
			document.getElementById('HC-name').className = "d2l-name bright";
			document.getElementById('HP-name').className = "d2l-name";
			document.getElementById('HP').innerHTML = lastIndex.hchpEjphpmBbrhpjb / 1000 + " kWh";
			document.getElementById('HC').innerHTML = "<b>" + lastIndex.baseHchcEjphnBbrhcjb / 1000 + " kWh" + "</b>";
			document.getElementById('HP-name').innerHTML = "HP";
			document.getElementById('HC-name').innerHTML = "<b>HC</b>";
		}
		else {
			document.getElementById('HC-name').className = "d2l-name";
			document.getElementById('HP-name').className = "d2l-name bright";
			document.getElementById('HP').innerHTML = "<b>" + lastIndex.hchpEjphpmBbrhpjb / 1000 + " kWh" + "</b>";
			document.getElementById('HC').innerHTML = lastIndex.baseHchcEjphnBbrhcjb / 1000 + " kWh";
			document.getElementById('HP-name').innerHTML = "<b>HP</b>";
			document.getElementById('HC-name').innerHTML = "HC";
		}
		document.getElementById('instant').innerHTML = parseFloat(instant).toString() + " W";
		document.getElementById('trends').innerHTML = parseFloat(trends).toString() + " W";

		if (this.config.showChart == true) {
			if (this.chart == undefined) {
				this.chart = this.createChart(consoPerHour);
			}
			else {
				this.updateData(
					this.chart,
					consoPerHour.map(({ hour }) => hour),
					[
						consoPerHour.map(({ hc }) => hc),
						consoPerHour.map(({ hp }) => hp)
					]
				);
			}
		}
	},

	updateData: function (chart, label, data) {
		chart.data.labels = label;
		chart.data.datasets[0].data = data[0];
		chart.data.datasets[1].data = data[1];
		chart.update();
	},

	createChart: function (consoPerHour) {
		Chart.defaults.color = 'lightgrey';
		return new Chart(document.getElementById('myChart'), {
			type: 'bar',
			data: {
				labels: consoPerHour.map(({ hour }) => hour),
				datasets: [
					{
						label: 'HC',
						data: consoPerHour.map(({ hc }) => hc),
						borderWidth: 2,
					},
					{
						label: 'HP',
						data: consoPerHour.map(({ hp }) => hp),
						borderWidth: 2,
					},
				]
			},
			options: {
				maintainAspectRatio:true,
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
		});
	},
});
