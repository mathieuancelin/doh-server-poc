# DoH servcer POC

prototype of a very simple DNS over HTTPS server written in node

```sh
echo '127.0.0.1    dns.foo.bar' >> /etc/hosts
yarn install
CERT_KEY_PATH="/path/to/cert.key" CERT_PATH="/path/to/cert.cer" CA_PATH="/path/to/ca/cert.cer" yarn start
```
and 

```sh
# using curl 7.62.0+
$ curl --doh-url https://dns.foo.bar:8444/dns-query http://www.fifou.bar:8888
```