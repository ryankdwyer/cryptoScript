const io = require('socket.io-client');
const subscriptions = require('./subscriptions.js');
const utils = require('./utils.js');

(function () {

    const socket = io.connect('https://streamer.cryptocompare.com/');
	var currentPrice = {};
    subscriptions.initSubs();
	console.log('Subscribing...');
    socket.emit('SubAdd', { subs: subscriptions.subStrings });

   	socket.on("m", function(message) {
		let messageType = message.substring(0, message.indexOf("~"));
		let res = {};
		if (messageType == utils.STATIC.TYPE.CURRENTAGG) {
			res = utils.CURRENT.unpack(message);
			dataUnpack(res);
		}
	}); 

	var dataUnpack = function(data) {
		let from = data['FROMSYMBOL'];
		let to = data['TOSYMBOL'];
		let fsym = utils.STATIC.CURRENCY.getSymbol(from);
		let tsym = utils.STATIC.CURRENCY.getSymbol(to);
		let pair = from + to;

		if (!currentPrice.hasOwnProperty(pair)) {
			currentPrice[pair] = {};
		}

		for (let key in data) {
			currentPrice[pair][key] = data[key];
		}

		if (currentPrice[pair]['LASTTRADEID']) {
			currentPrice[pair]['LASTTRADEID'] = parseInt(currentPrice[pair]['LASTTRADEID']).toFixed(0);
		}
		currentPrice[pair]['CHANGE24HOUR'] = utils.convertValueToDisplay(tsym, (currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']));
		currentPrice[pair]['CHANGE24HOURPCT'] = ((currentPrice[pair]['PRICE'] - currentPrice[pair]['OPEN24HOUR']) / currentPrice[pair]['OPEN24HOUR'] * 100).toFixed(2) + "%";;
		console.log(currentPrice[pair]);
	};

})();
