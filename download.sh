#!/bin/bash

curl -fsSL -H 'accept-encoding: zstd' 'https://www.facebook.com/privacy/policies/cookies/' -o fbcookies.html.zst
<fbcookies.html.zst zstd -d | zstd -5 >repacked.html.zst
<fbcookies.html.zst zstd -d | brotli -3 >repacked.html.br
