const fs = require('fs');

module.exports = {
  directives: {
    "TLSEngine": function(config, bstack, _mode) {
      if(_mode === undefined) return {"type": "ERROR", "msg": "expected on or off"};

      let mode = _mode.toLowerCase();

      if(mode === "on") {
        config.usetls = true;
      } else if(mode === "off") {
        config.usetls = false;
      } else {
        return {"type": "ERROR", "msg": "expected [on, off], got: " + parser.escape_string(mode)};
      }
    },
    "TLSCertificateFile": function(config, bstack, cert) {
      if(cert === undefined) return {"type": "ERROR", "msg": "expected path to TLS certificate file"};

      config.cert = cert;
    },
    "TLSKeyFile": function(config, bstack, key) {
      if(key === undefined) return {"type": "ERROR", "msg": "expected path to TLS private key file"};

      config.privkey = key;
    },
    "TLSPasswordHelper": function(config, bstack, bin) {
      if(bin === undefined) return {"type": "ERROR", "msg": "expected path to password prompting helper program"};
      
      try {
        let stat = fs.lstatSync(bin);
        if((stat.mode&0o100000)&&(stat.mode&1)) {
          config.passwd = bin;
        } else if(!(stat.mode&0o100000)) {
          return {"type": "ERROR", "msg": "expected a path to a regular file"};
        } else {
          return {"type": "ERROR", "msg": "file at location is not world-executable"};
        }
      } catch(err) {
        return {"type": "ERROR", "msg": "no such file: " + parser.escape_string(bin)};
      }
    },
    "TLSPFXFile": function(config, bstack, pfx) {
      if(pfx === undefined) return {"type": "ERROR", "msg": "expected path to TLS PKCS #12 encrypted file"};

      config.pfx = pfx;
    },
    "TLSHandshakeTimeout": function(config, bstack, seconds) {
      if(seconds === undefined) return {"type": "ERROR", "msg": "no time duration given"};
      
      if(/^[0-9]+(?:\.[0-9]+)?$/.test(seconds)) {
        config.timeout = parseInt(seconds);
      
        return {"type": "GOOD"};
      } else {
        return {"type": "ERROR", "msg": "not a valid positive integer: " + escape_string(seconds)};
      }
    }
  }
};

