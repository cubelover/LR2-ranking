const fs = require('fs');
const http = require('http');
const https = require('https');
const { Iconv } = require('iconv');
const sjis2utf8 = new Iconv('SHIFT_JIS', 'UTF-8//TRANSLIT//IGNORE');
const axios = require('axios').create({
	timeout: 10000,
	httpAgent: new http.Agent({ keepAlive: true }),
	httpsAgent: new https.Agent({ keepAlive: true }),
	baseURL: 'http://www.dream-pro.info/~lavalse/LR2IR/2/getrankingxml.cgi',
	responseType: 'arraybuffer',
	transformResponse: e => sjis2utf8.convert(e).toString(),
});
const xml = new (require('fast-xml-parser').XMLParser)();

const bms = [...new Set([]
	.concat(...Object.values(require('./bms.json')))
	.map(([, e]) => e))
].sort();

(async () => {
	const err = await new Promise((resolve) => {
		fs.access('cache', resolve);
	});
	if (err) {
		try {
			fs.mkdirSync('cache');
		} catch (err) {
			console.error("Cannot create cache", err);
			return;
		}
	}

	let k = bms.length;
	async function Do() {
		while (k) {
			console.log(k);
			k -= 1;
			const bmsmd5 = bms[k];
			const err = await new Promise((resolve) => {
				fs.access(`cache/${bmsmd5}.json`, resolve);
			});
			if (!err) continue;
			let score;
			while (true) {
				try {
					({ score } = xml.parse((await axios.get(`?songmd5=${bmsmd5}&id=1`)).data).ranking);
					break;
				}
				catch (err) {
					console.error(bmsmd5, err.toString());
				}
			}
			try {
				if (!Array.isArray(score)) score = [score];
				const res = [score[0].notes, Object.fromEntries(score.map(({ id, clear, pg, gr }) => [id, [clear - 1, pg + pg + gr]]))];
				fs.writeFileSync(`cache/${bmsmd5}.json`, JSON.stringify(res), console.error);
			} catch (err) {
				console.error(bmsmd5, score, err.toString());
			}
		}
	}
	const jobs = [];
	for (let i = 0; i < 16; i += 1) jobs.push(Do());
	await Promise.all(jobs);

	fs.open('ranking.json', 'w', (err, fd) => {
		if (err) throw err;
		fs.writeSync(fd, '{', console.error);
		let flag = false;
		bms.forEach((bmsmd5) => {
			fs.writeSync(fd, `${flag ? ',' : ''}"${bmsmd5}":${fs.readFileSync(`./cache/${bmsmd5}.json`, () => {})}`, () => {});
			flag = true;
		});
		fs.writeSync(fd, '}', console.error);
		fs.close(fd, console.error);
	});
})();
