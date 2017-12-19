const subs = {
    fromCoin: [
		'BTC',
		'ETH',
		'XRP',
		'LTC',
		'ADA',
		'XLM',
    ],
    toCoin: [
        'USD',
    ],
	exchanges: [
        'CCCAGG'
    ],
    subscriptionIds: [
        5,
    ],
    initSubs: function () {
        let self = this;
        self.fromCoin.forEach(function(from) {
            self.toCoin.forEach(function(to) {
                self.exchanges.forEach(function(xchng) {
                    self.subscriptionIds.forEach(function(subId) {
                        self.subStrings.push(`${subId}~${xchng}~${from}~${to}`);
                    });
                });
            });
        });
    },
    subStrings: [],
};

module.exports = subs;
