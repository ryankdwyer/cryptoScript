const subs = {
    fromCoin: [
		'XRP',
		'ADA',
		'XLM',
        'BTC',
        'NEO',
        'ETH',
        'LTC'
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
        self.fromCoin.forEach((from) => {
            self.toCoin.forEach((to) => {
                self.exchanges.forEach((xchng) => {
                    self.subscriptionIds.forEach((subId) => {
                        self.subStrings.push(`${subId}~${xchng}~${from}~${to}`);
                    });
                });
            });
        });
    },
    subStrings: [],
};

module.exports = subs;
