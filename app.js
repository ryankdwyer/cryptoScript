const io = require('socket.io-client');
const bluebird = require('bluebird');
const subscriptions = require('./subscriptions.js');
const utils = require('./utils.js');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const rClient = redis.createClient();

const hash_key = 'crypto_volume';

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

        addToRedis(pair, currentPrice[pair]);
	};

    var addToRedis = function (key, data) {

        if (!data || !key) return false;

        let keyVal = objToArray(data);
        console.log(key, keyVal);
        rClient.hmsetAsync(key, keyVal).then(function(res) {
            console.log(res);
        });
    }

    var objToArray = function (data) {
        let flattened = [];

        for (var key in data) {
            flattened.push(key);
            flattened.push(data[key]);
        }
        return flattened;
    }

})();
