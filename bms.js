const fs = require('fs');
const http = require('http');
const https = require('https');
const axios = require('axios').create({
	httpAgent: new http.Agent({ keepAlive: true }),
	httpsAgent: new https.Agent({ keepAlive: true }),
});

(async () => {
	const bms = {};
	const bmstitle = {};
	function Do(data) {
		data.forEach(({ md5, title, artist }) => {
			if (!(md5 in bmstitle)) bmstitle[md5] = [title, artist];
		});
	}
	async function Do2(diff, symbol, url) {
		const { data } = await axios.get(url);
		Do(data);
		bms[diff] = data.filter(({ md5 }) => md5).map(({ level, md5 }) => [`${symbol}${level}`, md5]);
	}
	await Do2('insane', '★', 'http://www.ribbit.xyz/bms/tables/insane_body.json');
	// await Do2('satellite', 'sl', 'https://stellabms.xyz/sl/score.json');
	// await Do2('stella', 'st', 'https://stellabms.xyz/st/score.json');
	// await Do2('overjoy', '★★', 'http://lr2.sakura.ne.jp/data/score.json');
	// await Do2('insane2', '▼', 'https://rattoto10.github.io/second_table/insane_data.json');
	fs.writeFile('bms.json', JSON.stringify(bms), console.error);
	fs.writeFile('bmstitle.json', JSON.stringify(bmstitle), console.error);
})();
