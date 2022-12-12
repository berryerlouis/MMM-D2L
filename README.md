# Module: MMM-D2L
The module allows you to fetch data from Linky D2L module, see https://d2l.sicame.io/ for more information.

## UI
![UI](mmm-d2l.png)

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/berryerlouis/MMM-D2L.git
````

Install the module dependencies:
````
cd MMM-D2L
npm install
````

Configure the module in your `config.js` file.

**Note:** After starting the Mirror, it will take a few seconds before the wallpapers start to appear.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
  {
    module: "MMM-D2L",
    position: "right",
    config: { // See "Configuration options" for more information.
      login: "",
      password: "",
      contract:6000,
      nbHoursToFetch:24,
		  showChart: true,
      heuresCreuses:[
        {
          start:0,
          end:6
        },
        {
          start:11,
          end:14
        },
      ],
    }
  }
]
````

## Configuration options

The following properties can be configured:



|Option|Default|Description|
|---|---|---|
|`login`|`""`|Set the login from https://d2l.sicame.io/.|
|`password`|`""`|Set the password from https://d2l.sicame.io/.|
|`contract`|`6000`|Set the max Watt contract subscribed.|
|`showChart`|`true`|Show Chart.|
|`nbHoursToFetch`|`24`|Number of hours to fetch data.|
|`updateInterval`|`60 * 60 * 1000`|How often (in ms) to fetch data.|
|`heuresCreuses`|`[{start:0,end:6},{start:11,end:14}]`|set the hours of each 'heures creuses' from start to end.|

## Notifications

MMM-Wallpaper can react to the following notifications sent by other modules:

|Notification|Payload|Description|
|---|---|---|
|`UPDATE_D2L`|`none`|Will update the data from d2l.|