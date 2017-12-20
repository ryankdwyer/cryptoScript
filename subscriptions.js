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
