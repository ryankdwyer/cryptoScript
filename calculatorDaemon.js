const subscriptions = require('./subscriptions.js');
const bluebird = require('bluebird');
const utils = require('./utils.js');
const Table = require('cli-table2');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const r = redis.createClient();
const moment = require('moment-timezone');

const sortedSetKey = 'crypto_volume';

(function () {

    var table = new Table({
        head: ['Pair', '\u0916 Volume', '\u0916 Price'],
        colWidths: [100, 100, 100]
    });
        
    setInterval(function () {
        var table = new Table({
            head: ['Pair', 'To', 'From', '\u0394 Volume', '\u0394 Price'],
            colWidths: [10, 25, 25, 10, 10],
        });
        getLastEvents().then(function(events) {
            let eventIds = getEventIds(events);
            if (!eventIds || eventIds.length < 2) {
                throw 'Not enough events, sleeping...';
            }
            return getHashes(eventIds);
        })
        .then(function(hashes) {
            let pairMap = {};
            hashes.forEach((data) => {
                let pair = `${data.FROMSYMBOL}${data.TOSYMBOL}`;
                let dataObj = buildDataObj(data);

                if ( pairMap[pair] ) {
                    pairMap[pair].push(dataObj);
                } else {
                    pairMap[pair] = [dataObj]
                }
            });

            if (!hashes.length) return;

            let volumeMap = {};
            let priceMap = {};
            let toFrom = {};
            for (var pair in pairMap) {
                if (pairMap.hasOwnProperty(pair)) {
                    volumeMap[pair] = calcRateOfChange(pairMap[pair], 'VOLUMEHOUR');
                    priceMap[pair] = calcRateOfChange(pairMap[pair], 'PRICE');
                }
            }
            printValuesToTable(volumeMap, priceMap);
            let to = moment.tz(pairMap[pair][0].LASTUPDATE * 1000 , 'America/New_York').format('YY-MM-DD HH:mm:ss');
            let from = moment.tz(pairMap[pair][pairMap[pair].length - 1].LASTUPDATE * 1000, 'America/New_York').format('YY-MM-DD HH:mm:ss');
            toFrom[pair] = {to: to, from: from};
            volumeMap[pair] = calcChange(pairMap[pair], 'VOLUMEHOUR');
            priceMap[pair] = calcChange(pairMap[pair], 'PRICE');
            return hashes;
        })
        .then(function(hashes) {
            if (!hashes) return;
            hashes = hashes.map((el) => {
                return `event:${el.id}`;
            });
            return removeHashes([hashes[0]]);
        })
        .then(function(res) {
            if (!res) return;
            return removeLastEvents();
        })
        .then(function(res) {
            if (!res) {
                console.log('No data, sleeping for 10 seconds');
                return;
            }
        });
    }, 2000)
    

    function getLastEvents () {
        return r.zrangeAsync(sortedSetKey, 0, 5, 'WITHSCORES');
    }

    function removeLastEvents () {
        return r.zremrangebyrankAsync(sortedSetKey, 0, 1);
    }

    function removeHashes (keys) {
        return r.delAsync(keys);
    }

    function getHashes (eventIds) {
        let p = [];
        eventIds.forEach( (eventId) => {
            p.push(r.hgetallAsync(eventId));
        });
        return Promise.all(p);
    }

    function buildDataObj (data) {
        let ret = {};
        let props = ['PRICE', 'LASTUPDATE', 'VOLUMEHOUR', 'VOLUME24HOUR'];

        props.forEach((prop) => {
            if (data[prop]) {
                ret[prop] = data[prop];
            }
        });
        return ret;
    }

    function calcRateOfChange(data, key) {
        if (!data.length > 1) return 0;

        let firstVal = data[0][key];
        let firstTime = data[0]['LASTUPDATE'];
        let lastVal = data[data.length - 1][key];
        let lastTime = data[data.length - 1]['LASTUPDATE'];

        let rateOfChange = ( lastVal - firstVal ) / ( lastTime - firstTime );
        return rateOfChange;
    }

    function calcChange (data, key) {
        let first = data[0][key];
        let last = data[data.length - 1][key];
        let from = data[0].LASTUPDATE;
        let to = data[data.length - 1].LASTUPDATE;
        return ( last - first ) / (to - from);

        //if (data.length < 5) return 0;
        //deriv = 0;
        //coeff = [1,-8,0,8,-1];
        //h = 2;
        //N = 5;
        //for (var i = 0; i < N; i++) {
        //    deriv += (data[i][key] * coeff[i]);
        //}
        //deriv /= ( 12 * h );
        //return deriv;
    }

    function printToTable(table, times, volumes, prices) {
        for (var key in times) {
            if (times.hasOwnProperty(key)) {
                let to = times[key].to;
                let from = times[key].from;
                let vol = volumes[key];
                let price = prices[key];
                table.push([key, to, from, vol, price]);
            }
        }
        console.log(table.toString());
    }

    function printValuesToTable (vol, price) {
        
    }
    function getEventIds(events) {
        return events.reduce(function(prev, curr, i) {
            if ( i % 2 === 1 ) {
                prev.push(`event:${curr}`);
            }
            return prev;
        }, []);
    };

})();
