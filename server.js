const fs = require('fs'); 
const http = require('http'); 
const https = require('https'); 
const dnsPacket = require('dns-packet');

/*
# WARNING: does not work with self signed certs
openssl genrsa -out ./ca.key 4096
openssl rsa -in ./ca.key -out ./ca.key
openssl req -new -x509 -sha256 -days 730 -key ./ca.key -out ./ca.cer -subj "/CN=DNSCA"
openssl genrsa -out ./dns.key 2048
openssl rsa -in ./dns.key -out ./dns.key
openssl req -new -key ./dns.key -sha256 -out ./dns.csr -subj "/CN=dns.foo.bar"
openssl x509 -req -days 365 -sha256 -in ./dns.csr -CA ./ca.cer -CAkey ./ca.key -set_serial 1 -out ./dns.cer
openssl verify -CAfile ./ca.cer ./dns.cer
*/

const options = { 
  key: fs.readFileSync(process.env.CERT_KEY_PATH || './dns.key'), 
  cert: fs.readFileSync(process.env.CERT_PATH || './dns.cer'), 
  ca: fs.readFileSync(process.env.CA_PATH || './ca.cer'), 
}; 

const configuration = [
  {
    name: '*.fifou.bar',
    ttl: 300,
    type: 'A',
    class: 'IN',
    data: '127.0.0.1'
  }
];

function find(type, domain) {
  const found = configuration.filter(conf => {
    return conf.type === type;
  }).filter(conf => {
    const regex = new RegExp(conf.name.replace(/\./g, "\\.").replace(/\*/g, ".*"), 'i');
    return regex.test(domain);
  })[0];
  if (found) {
    console.log(`query { ${type} ${domain} } - response { ${found.type} ${found.name} ${found.data} ${found.ttl} }`);
    return { ...found, name: domain };
  }
  return null;
}

https.createServer(options, (req, res) => { 
  if (req.method.toLowerCase() === 'post') {
    const body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      const concatBody = Buffer.concat(body);
      const query = dnsPacket.decode(concatBody);
      res.writeHead(200, {
        'Content-Type': 'application/dns-message',
      }); 
      const response = {
        type: 'response',
        answers: query.questions.map(q => find(q.type, q.name)).filter(a => !!a)
      };
      res.end(dnsPacket.encode(response)); 
    }).on('error', (e) => {
      res.writeHead(500, {
        'Content-Type': 'application/dns-message',
      }); 
      res.end(''); 
    });
  } else {
    res.writeHead(400, {
      'Content-Type': 'application/dns-message',
    }); 
    res.end(''); 
  }
}).listen(8444);

http.createServer((req, res) => { 
  res.writeHead(200, { 'Content-Type': 'application/json' }); 
  res.end(`{"hello":"world"}\n`); 
}).listen(8888);