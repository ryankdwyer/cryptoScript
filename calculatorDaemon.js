const subscriptions = require('./subscriptions.js');
const bluebird = require('bluebird');
const utils = require('./utils.js');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const r = redis.createClient();

const sortedSetKey = 'crypto_volume';

(function () {

        
    getLastEvents().then(function(events) {
        let eventIds = events.reduce(function(prev, curr, i) {
            if ( i % 2 === 1 ) {
                prev.push(`event:${curr}`);
            }
            return prev;
        }, []);
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

        let volumeMap = {};
        let priceMap = {};
        for (var pair in pairMap) {
            if (pairMap.hasOwnProperty(pair)) {
                volumeMap[pair] = calcVolumeChange(pairMap[pair]);
                priceMap[pair] = calcPriceChange(pairMap[pair]);
            }
        }
        console.log(volumeMap);
    })

    function getLastEvents () {
        return r.zrangeAsync(sortedSetKey, 0, 5, 'WITHSCORES');
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

    function calcVolumeChange (data) {
        if (data.length < 5) return 0;
        deriv = 0;
        coeff = [1,-8,0,8,-1];
        h = 2;
        N = 5;
        for (var i = 0; i < N; i++) {
            deriv += (data[i].VOLUMEHOUR * coeff[i]);
        }
        deriv /= ( 12 * h );
        return deriv;
    }

})();
