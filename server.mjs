#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const originalZstd = readFileSync('fbcookies.html.zst');
const repackedZstd = readFileSync('repacked.html.zst');
const repackedBrotli = readFileSync('repacked.html.br');

const chunkLength = 1024;
const chunkDelay = 100;

async function serveStaticSlowly(response, binary, contentEncoding) {
	response.writeHead(200, {'content-type': 'text/html;charset=utf-8', 'content-encoding': contentEncoding});

	let cooldown;
	for (let i = 0; i < binary.byteLength;) {
		if (cooldown) {
			await cooldown;
		}
		cooldown = new Promise(r => setTimeout(r, chunkDelay));
		response.write(binary.subarray(i, i = Math.min(i + chunkLength, binary.byteLength)));
	}
	response.end();
}

function serveIndex(response) {
	response.writeHead(200, { 'content-type': 'text/html;charset=utf-8'});
	response.end(`
<!doctype html>
<title>zstd vs brotli progressive loading</title>

<p>This is a synthetic test of using ZStandard for serving HTML content over slow connections.</p>

<p>Those three pages are served with a huge delay (${chunkLength} bytes each ${chunkDelay} ms to be precise). Load them up in your browser and notice how the first stylesheet loading start time is different.</p>
<ul>
<li><a href="/original.html">original.html</a> The original zstd compressed Facebook https://www.facebook.com/privacy/policies/cookies/ HTML page. The compressed binary is identical to what FB servers are serving.</li>
<li><a href="/repacked.html">repacked.html</a> The same HTML page zstd re-compressed without Facebook's manual flushing magic. Your server would most probably compress HTML like that.</li>
<li><a href="/brotli.html">brotli.html</a> The same HTML page re-compressed with brotli.</li>
</ul>

<p>Run <code>download.sh</code> if you want to get a fresh copy of the original page and the recompressed binaries. Or, do nothing if you don't trust random shell scripts from the internets.</p>
	`);
}

createServer(
	(request, response) => {
		const url = new URL(request.url, 'http://localhost');
		switch (url.pathname) {
			case '/':
				serveIndex(response);
				break;
			case '/original.html':
				serveStaticSlowly(response, originalZstd, 'zstd');
				break;
			case '/repacked.html':
				serveStaticSlowly(response, repackedZstd, 'zstd');
				break;
			case '/brotli.html':
				serveStaticSlowly(response, repackedBrotli, 'br');
				break;
			default:
				response.writeHead(404);
				response.end();
		}

	}
)
	.listen(8080)
	.on('listening', function(){ console.log(`http://localhost:${this.address().port}/`) })
;