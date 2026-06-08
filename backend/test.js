const dns = require('dns');

dns.setServers(['8.8.8.8']);

dns.resolveSrv(
  '_mongodb._tcp.mycluster.uhyogyf.mongodb.net',
  (err, records) => {
    console.log(err || records);
  }
);