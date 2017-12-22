const subscriptions = require('./subscriptions.js');
const bluebird = require('bluebird');
const utils = require('./utils.js');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const r = redis.createClient();

const sortedSetKey = 'crypto_volume';

(function () {

        
        getLastEvents()
            .then(function(events) {
                let eventIds = events.reduce(function(prev, curr, i) {
                    if ( i % 2 === 1 ) {
                        prev.push(`event:${curr}`);
                    }
                    return prev;
                }, []);
                return getHashes(eventIds);
            })
            .then(function(hashes) {
                console.log(hashes);
            })
        console.log('Sleeping for 2 seconds');


    function getLastEvents () {
        return r.zrevrangeAsync(sortedSetKey, 0, 500, 'WITHSCORES');
    }

    function getHashes (eventIds) {
        let p = [];
        eventIds.forEach( (eventId) => {
            p.push(r.hgetallAsync(eventId));
        });
        return Promise.all(p);
    }

})();
