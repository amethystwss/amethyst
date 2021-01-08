const fs = require('fs');
const util = require('util'); // not necessary for release
const path = require('path');
const os = require('os');
const net = require('net');
const {STATUS_CODES} = require('http');

const DISALLOWED_CUSTOM_HEADERS = [
  "server", "content-type", "content-length", "connection",
  "upgrade", "sec-websocket-accept"
];

const AMETHYST_PRODUCT = "Amethyst";
const AMETHYST_VERSION = "0.1.0";
const AMETHYST_PLATFORM = os.platform();

const pad = (str, length, char = ' ') => str.padStart((str.length + length) / 2, char).padEnd(length, char);

class EventStore {
  #register_count;
  
  constructor() {
    this.store = {};
    this.#register_count = 0;
  }

  register(module, priority, name, object) {
    object = {
      config: "local",
      ...object
    };

    this.store[priority.toString()] = this.store[priority.toString()]||{};
    this.store[priority.toString()][module.toString()] = this.store[priority.toString()][module.toString()]||{}
    this.store[priority.toString()][module.toString()][name.toString()] = {id:this.#register_count,callback:object.callback,config:object.config};
    ++this.#register_count;
  }

  getFrames(event_name) {
    let keys = Object.keys(this.store);
    keys.sort(function(a, b) {
      return parseInt(a)-parseInt(b);
    });

    let res = [];

    for(let key of keys) {
      let modules = Object.keys(this.store[key]);
      modules.sort();

      for(let module of modules) {
        if(this.store[key][module][event_name]) res.push({
          callback: this.store[key][module][event_name].callback,
          module: module,
          priority: parseInt(key),
          name: event_name,
          id: this.store[key][module][event_name].id,
          config: this.store[key][module][event_name].config
        });
      }
    }

    return res;
  }

  dispatch(event_name, this_obj, config_obj, ...opts) {
    let frames = this.getFrames(event_name);
    let res = [];

    for(let frame of frames) {
      res.push({
        ret: (function() {
          if(frame.config === "local") {
            return frame.callback.apply(this_obj, [config_obj[frame.module], ...opts]);
          } else {
            return frame.callback.apply(this_obj, [config_obj, ...opts]);
          }
        })(),
        callback: frame.callback,
        module: frame.module,
        priority: frame.priority,
        name: event_name,
        id: frame.id
      });
    }

    return res;
  }

  getStore() {
    return this.store;
  }
  
  table() {
    return this.tableById();
  }

  tableById() {
    let keys = Object.keys(this.store);

    let res = [];
    
    let maxIdWidth = 2;         // Room for "ID"
    let maxPriorityWidth = 8;   // Room for "Priority"
    let maxModuleWidth = 6;     // Room for "Module"
    let maxEventNameWidth = 5;  // Room for "Event"
    let maxAccessWidth = 12;    // Room for "ConfigAccess"

    for(let key of keys) {
      let modules = Object.keys(this.store[key]);
      modules.sort();

      for(let module of modules) {
        for(let event_name of Object.keys(this.store[key][module])) {
          let frame = {
            callback: this.store[key][module][event_name].callback,
            module: module,
            priority: parseInt(key),
            name: event_name,
            id: this.store[key][module][event_name].id,
            config: this.store[key][module][event_name].config
          };

          res.push(frame);

          maxIdWidth = Math.max(maxIdWidth, frame.id.toString().length);
          maxPriorityWidth = Math.max(maxPriorityWidth, key.length);
          maxModuleWidth = Math.max(maxModuleWidth, module.length);
          maxEventNameWidth = Math.max(maxEventNameWidth, event_name.length);
          maxAccessWidth = Math.max(maxAccessWidth, (frame.config==="local"?"module":"global").length);
        }
      }
    }
    
    res.sort(function(a, b) {
      return a.id-b.id;
    });

    let str = "";
    
    let idHeader = pad("ID", maxIdWidth);
    let priorityHeader = pad("Priority", maxPriorityWidth);
    let moduleHeader = pad("Module", maxModuleWidth);
    let eventHeader = pad("Event", maxEventNameWidth);
    let accessHeader = pad("ConfigAccess", maxAccessWidth);

    str += "| " + idHeader + " ";
    str += "| " + priorityHeader + " ";
    str += "| " + moduleHeader + " ";
    str += "| " + eventHeader + " ";
    str += "| " + accessHeader + " |\n";
    str += "+" + "-".repeat(idHeader.length+2);
    str += "+" + "-".repeat(priorityHeader.length+2);
    str += "+" + "-".repeat(moduleHeader.length+2);
    str += "+" + "-".repeat(eventHeader.length+2);
    str += "+" + "-".repeat(accessHeader.length+2) + "+\n";

    for(let row of res) {
      str += "| " + pad(row.id.toString(), maxIdWidth) + " ";
      str += "| " + pad(row.priority.toString(), maxPriorityWidth) + " ";
      str += "| " + pad(row.module, maxModuleWidth) + " ";
      str += "| " + pad(row.name, maxEventNameWidth) + " ";
      str += "| " + pad(row.config==="local"?"module":"global", maxAccessWidth) + " |\n";
    }

    return str.trim();
  }
  
  tableByPriority() {
    let keys = Object.keys(this.store);
    keys.sort(function(a, b) {
      return parseInt(a)-parseInt(b);
    });

    let res = [];
    
    let maxIdWidth = 2;         // Room for "ID"
    let maxPriorityWidth = 8;   // Room for "Priority"
    let maxModuleWidth = 6;     // Room for "Module"
    let maxEventNameWidth = 5;  // Room for "Event"

    for(let key of keys) {
      let modules = Object.keys(this.store[key]);
      modules.sort();

      for(let module of modules) {
        for(let event_name of Object.keys(this.store[key][module])) {
          let frame = {
            callback: this.store[key][module][event_name].callback,
            module: module,
            priority: parseInt(key),
            name: event_name,
            id: this.store[key][module][event_name].id,
            config: this.store[key][module][event_name].config
          };

          res.push(frame);

          maxIdWidth = Math.max(maxIdWidth, frame.id.toString().length);
          maxPriorityWidth = Math.max(maxPriorityWidth, key.length);
          maxModuleWidth = Math.max(maxModuleWidth, module.length);
          maxEventNameWidth = Math.max(maxEventNameWidth, event_name.length);
        }
      }
    }
    
    let str = "";
    
    let idHeader = pad("ID", maxIdWidth);
    let priorityHeader = pad("Priority", maxPriorityWidth);
    let moduleHeader = pad("Module", maxModuleWidth);
    let eventHeader = pad("Event", maxEventNameWidth);

    str += "| " + idHeader + " ";
    str += "| " + priorityHeader + " ";
    str += "| " + moduleHeader + " ";
    str += "| " + eventHeader + " |\n";
    str += "+" + "-".repeat(idHeader.length+2);
    str += "+" + "-".repeat(priorityHeader.length+2);
    str += "+" + "-".repeat(moduleHeader.length+2);
    str += "+" + "-".repeat(eventHeader.length+2) + "+\n";

    for(let row of res) {
      str += "| " + pad(row.id.toString(), maxIdWidth) + " ";
      str += "| " + pad(row.priority.toString(), maxPriorityWidth) + " ";
      str += "| " + pad(row.module, maxModuleWidth) + " ";
      str += "| " + pad(row.name, maxEventNameWidth) + " |\n";
    }

    return str.trim();
  }
  
  tableByModule() {
    let keys = Object.keys(this.store);

    let res = [];
    
    let maxIdWidth = 2;         // Room for "ID"
    let maxPriorityWidth = 8;   // Room for "Priority"
    let maxModuleWidth = 6;     // Room for "Module"
    let maxEventNameWidth = 5;  // Room for "Event"

    for(let key of keys) {
      let modules = Object.keys(this.store[key]);
      modules.sort();

      for(let module of modules) {
        for(let event_name of Object.keys(this.store[key][module])) {
          let frame = {
            callback: this.store[key][module][event_name].callback,
            module: module,
            priority: parseInt(key),
            name: event_name,
            id: this.store[key][module][event_name].id,
            config: this.store[key][module][event_name].config
          };

          res.push(frame);

          maxIdWidth = Math.max(maxIdWidth, frame.id.toString().length);
          maxPriorityWidth = Math.max(maxPriorityWidth, key.length);
          maxModuleWidth = Math.max(maxModuleWidth, module.length);
          maxEventNameWidth = Math.max(maxEventNameWidth, event_name.length);
        }
      }
    }
    
    res.sort(function(a, b){return a.id-b.id});
    res.sort(function(a, b) {
      if(a.module === b.module) return 0;
      let mock = [a.module, b.module];
      mock.sort();

      return (mock[0]===a.module?-1:1);
    });

    let str = "";
    
    let idHeader = pad("ID", maxIdWidth);
    let priorityHeader = pad("Priority", maxPriorityWidth);
    let moduleHeader = pad("Module", maxModuleWidth);
    let eventHeader = pad("Event", maxEventNameWidth);

    str += "| " + idHeader + " ";
    str += "| " + priorityHeader + " ";
    str += "| " + moduleHeader + " ";
    str += "| " + eventHeader + " |\n";
    str += "+" + "-".repeat(idHeader.length+2);
    str += "+" + "-".repeat(priorityHeader.length+2);
    str += "+" + "-".repeat(moduleHeader.length+2);
    str += "+" + "-".repeat(eventHeader.length+2) + "+\n";

    for(let row of res) {
      str += "| " + pad(row.id.toString(), maxIdWidth) + " ";
      str += "| " + pad(row.priority.toString(), maxPriorityWidth) + " ";
      str += "| " + pad(row.module, maxModuleWidth) + " ";
      str += "| " + pad(row.name, maxEventNameWidth) + " |\n";
    }

    return str.trim();
  }
  
  tableByEvent() {
    let keys = Object.keys(this.store);

    let res = [];
    
    let maxIdWidth = 2;         // Room for "ID"
    let maxPriorityWidth = 8;   // Room for "Priority"
    let maxModuleWidth = 6;     // Room for "Module"
    let maxEventNameWidth = 5;  // Room for "Event"

    for(let key of keys) {
      let modules = Object.keys(this.store[key]);
      modules.sort();

      for(let module of modules) {
        for(let event_name of Object.keys(this.store[key][module])) {
          let frame = {
            callback: this.store[key][module][event_name].callback,
            module: module,
            priority: parseInt(key),
            name: event_name,
            id: this.store[key][module][event_name].id,
            config: this.store[key][module][event_name].config
          };

          res.push(frame);

          maxIdWidth = Math.max(maxIdWidth, frame.id.toString().length);
          maxPriorityWidth = Math.max(maxPriorityWidth, key.length);
          maxModuleWidth = Math.max(maxModuleWidth, module.length);
          maxEventNameWidth = Math.max(maxEventNameWidth, event_name.length);
        }
      }
    }
    
    res.sort(function(a, b){return a.id-b.id});
    res.sort(function(a, b) {
      if(a.name === b.name) return 0;
      let mock = [a.name, b.name];
      mock.sort();

      return (mock[0]===a.name?-1:1);
    });

    let str = "";
    
    let idHeader = pad("ID", maxIdWidth);
    let priorityHeader = pad("Priority", maxPriorityWidth);
    let moduleHeader = pad("Module", maxModuleWidth);
    let eventHeader = pad("Event", maxEventNameWidth);

    str += "| " + idHeader + " ";
    str += "| " + priorityHeader + " ";
    str += "| " + moduleHeader + " ";
    str += "| " + eventHeader + " |\n";
    str += "+" + "-".repeat(idHeader.length+2);
    str += "+" + "-".repeat(priorityHeader.length+2);
    str += "+" + "-".repeat(moduleHeader.length+2);
    str += "+" + "-".repeat(eventHeader.length+2) + "+\n";

    for(let row of res) {
      str += "| " + pad(row.id.toString(), maxIdWidth) + " ";
      str += "| " + pad(row.priority.toString(), maxPriorityWidth) + " ";
      str += "| " + pad(row.module, maxModuleWidth) + " ";
      str += "| " + pad(row.name, maxEventNameWidth) + " |\n";
    }

    return str.trim();
  }
}

function expand_inet6(ip_string) {
    // replace ipv4 address if any
    var ipv4 = ip_string.match(/(.*:)([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$)/);
    if (ipv4) {
        var ip_string = ipv4[1];
        ipv4 = ipv4[2].match(/[0-9]+/g);
        for (var i = 0;i < 4;i ++) {
            var byte = parseInt(ipv4[i],10);
            ipv4[i] = ("0" + byte.toString(16)).substr(-2);
        }
        ip_string += ipv4[0] + ipv4[1] + ':' + ipv4[2] + ipv4[3];
    }

    // take care of leading and trailing ::
    ip_string = ip_string.replace(/^:|:$/g, '');

    var ipv6 = ip_string.split(':');

    for (var i = 0; i < ipv6.length; i ++) {
        var hex = ipv6[i];
        if (hex != "") {
            // normalize leading zeros
            ipv6[i] = ("0000" + hex).substr(-4);
        }
        else {
            // normalize grouped zeros ::
            hex = [];
            for (var j = ipv6.length; j <= 8; j ++) {
                hex.push('0000');
            }
            ipv6[i] = hex.join(':');
        }
    }

    return ipv6.join(':');
};

function match_ip_addresses(test_string, ip) {
  let v = 4;
  if(ip.indexOf(':') !== -1) v = 6;

  if(test_string.indexOf('/') !== -1) {
    if(v == 4) {
      let ipint = ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
      let subnetint = test_string.substr(0, test_string.indexOf('/')).split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
      let mask = parseInt(test_string.substr(test_string.indexOf('/')+1));
      let invmask = 32-mask;

      let ip_ = ipint>>invmask;
      let sn_ = subnetint>>invmask;

      return ip_ === sn_;
    } else {
      let v6 = expand_inet6(ip).split(':');
      let sn = expand_inet6(test_string.substr(0, test_string.indexOf('/'))).split(':');
      let mask = parseInt(test_string.substr(test_string.indexOf('/')+1));
      for(let i = 0; i < 8; ++i) {
        const bits = Math.min(mask - i*16, 16);

        if(bits <= 0) break;

        const sn_ = ((sn[i] && parseInt(sn[i], 16))||0) >> (16-bits);
        const ip_ = ((v6[i] && parseInt(v6[i], 16))||0) >> (16-bits);

        if(sn_ !== ip_) return false;
      }

      return true;
    }
  } else if(test_string.indexOf(':') !== -1) {
    if(v == 4) {
      return false;
    }

    let sn_ = expand_inet6(test_string);
    let ip_ = expand_inet6(ip);
    return sn_ === ip_;
  } else {
    if(v == 6) {
      return false;
    }
    
    let ipint = ip.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;
    let subnetint = test_string.split('.').reduce(function(ipInt, octet) { return (ipInt<<8) + parseInt(octet, 10)}, 0) >>> 0;

    return ipint === subnetint;
  }
}

// e.g. "Hello at $PWD" -> "Hello at /etc/amethyst"
function resolve_envvars(str) {
  let res = "";
  let envvar = "";
  let env = false;
  let errors = ["envvars"];
  
  for(let i = 0; i < str.length; ++i) {
    let ch = str[i];
  
    if(ch === "$") {
      env = true;
  
      if(str[i+1] === "{") {
        ++i;
        env = null;
      }
    } else if(env !== false) {
      if(ch === "}") {
        if(process.env[envvar] === undefined) {
          errors.push({envvar, "msg": "no such environment variable"});
          env = false;
          envvar = "";
        } else {
          env = false;
          res += process.env[envvar];
          envvar = "";
        }
      } else if(env === true && !((ch.charCodeAt(0)>=65&&ch.charCodeAt(0)<=90)||(ch.charCodeAt(0)>=97&&ch.charCodeAt(0)<=122)) && ch.charCodeAt(0) !== 95) {
        if(process.env[envvar] === undefined) {
          errors.push({envvar, "msg": "no such environment variable"});
          env = false;
          envvar = "";
          --i;
        } else {
          env = false
          res += process.env[envvar];
          envvar = "";
          --i;
        }
      } else {
        envvar += ch;
      }
    } else {
      res += ch;
    }
  }
  
  if(errors.length > 1) return errors;
  return res;
}

function parse_file(filename) {
  let data = "";

  try {
    data = fs.readFileSync(filename).toString().split('\n');
  } catch(err) {
    if(err.code === "ENOENT") {
      return { "type": "ERROR", "content": [{"filename":filename,msg:"no such file"}]};
    } else {
      return { "type": "ERROR", "content": [{"filename":filename,msg:"insufficient permissions"}]};
    }
  }

  let statements = {"type": "FILE", "location": (path.isAbsolute(filename)?filename:path.normalize(__dirname + '/' + filename)), "content": []};
  let errors = {"type": "ERROR", "content": []};

  let block_stack = [];
  // <PreResponse>  -> block_stack = [ "PreResponse" ]
  //   <If true>    -> block_stack = [ "PreResponse", "If" ]
  //   </If>        -> block_stack = [ "PreResponse" ]
  // </PreResponse> -> block_stack = []
  
  let erroneous_config = false;
  
  for(let j = 0; j < data.length; ++j) {
    let line = data[j];
    const chars = line.split('');
  
    let quotes = null;  // One of null, ', or "
    let directive = "";
    let args = [];
    let arg = "";
    let directive_done = false;
    let error = false;
    let block_mode = false;
    let is_new_block = false;
    let first_char_pos = -1;
    // block_mode = false      -> not a block
    // block_mode = true       -> is a block
    // block_mode = null       -> is a closing block segment
    // block_mode = undefined  -> is after a block segment
    for(let i = 0; i < chars.length; ++i) {
      let ch = chars[i];
      if(block_mode === undefined && ch !== " " && ch !== "\t" && ch !== "#") {
        errors.content.push({filename, line: (j+1), col: (i+1), msg: "nothing can come after a block segment"});
        error = true;
        break;
      } else if(ch === "<") {
        if(first_char_pos === -1) first_char_pos = i+1;
        if(directive === "") {
          block_mode = true;
          is_new_block = true;
        } else {
          arg += "<";
        }
      } else if(ch === "/" && block_mode === true) {
        if(first_char_pos === -1) first_char_pos = i+1;
        if(directive === "") {
          block_mode = null;
          is_new_block = false;
        } else if(!directive_done) {
          errors.content.push({filename, line: (j+1), col: (i+1), msg: "use of token '/' after start of block name"});
          error = true;
          break;
        } else {
          arg += "/";
        }
      } else if(ch === ">") {
        if(first_char_pos === -1) first_char_pos = i+1;
        if(block_mode !== false) {
          if(block_mode === true) {
            block_stack.push(directive);
          } else {
            if(block_stack[block_stack.length-1] !== directive) {
              errors.content.push({filename, line: (j+1), col: (i+1), msg: ("expected closing block for " + block_stack[block_stack.length-1] + " but got " + directive)});
              error = true;
              break;
            } else {
              block_stack.pop();
            }
          }
  
          if(!directive_done) directive_done = true;
          block_mode = undefined;
        } else {
          if(directive === "") {
            errors.content.push({filename, line: (j+1), col: (i+1), msg: "directive must start with a letter"});
            error = true;
            break;
          } else {
            arg += ">";
          }
        }
      } else if(ch === " ") {
        if(directive_done === false && directive !== "") {
          directive_done = true;
        } else {
          if(quotes === null) {
            if(arg !== "") {
              args.push(arg);
              arg = "";
            }
          } else {
            arg += " ";
          }
        }
      } else if(ch === "\t") {
        if(directive_done === false && directive !== "") {
          directive_done = true;
        } else if(directive_done === true) {
          if(quotes === null) {
            if(arg !== "") {
              args.push(arg);
              arg = "";
            }
          } else {
            arg += "\t";
          }
        }
      } else if(ch === '"') {
        if(first_char_pos === -1) first_char_pos = i+1;
        if(directive_done === false) {
          errors.content.push({filename, line: (j+1), col: (i+1), msg: "quotation in directive name"});
          error = true;
          break;
        } if(quotes === null) {
          quotes = '"';
        } else if(quotes === '"') {
          quotes = null;
          if(block_mode === false && chars[i+1] && chars[i+1] !== ' ' && chars[i+1] !== '\t') {
            errors.content.push({filename, line: (j+1), col: (i+1), msg: "quotation error"});
            error = true;
            break;
          }
        } else {
          arg += '"';
        }
      } else if(ch === "'") {
        if(first_char_pos === -1) first_char_pos = i+1;
        if(directive_done === false) {
          errors.content.push({filename, line: (j+1), col: (i+1), msg: "quotation in directive"});
          error = true;
          break;
        } else if(quotes === null) {
          quotes = "'";
        } else if(quotes === "'") {
          quotes = null;
          if(block_mode === false && chars[i+1] && chars[i+1] !== ' ' && chars[i+1] !== '\t') {
            errors.content.push({filename, line: (j+1), col: (i+1), msg: "quotation error"});
            error = true;
            break;
          }
        } else {
          arg += "'";
        }
      } else if(ch === "#") {
        if(first_char_pos === -1) first_char_pos = i+1;
        if(directive_done === false) {
          if(directive.length) directive_done = true;
          break;
        } else if(quotes !== null) {
          arg += "#";
        } else {
          break;
        }
      } else if(ch === "\\") {
        if(first_char_pos === -1) first_char_pos = i+1;
        if(directive_done === false) {
          console.error({filename, line: (j+1), col: (i+1), msg: "backslashes aren't part of directive names"});
          error = true;
          break;
        } else {
          if(quotes === null) arg += "\\";
          else {
            ++i;
            if(chars[i] === '"' || chars[i] === "'") arg += chars[i];
            else arg += ("\\" + chars[i]);
          }
        }
      } else {
        if(first_char_pos === -1) first_char_pos = i+1;
        if(directive_done === false) {
          directive += ch;
        } else {
          arg += ch;
        }
      }
    }
    
    if(error) {
      erroneous_config = true;
      continue;
    }
  
    if(quotes) {
      errors.content.push({filename, line: (j+1), col: (line.length), msg: "unclosed quotes"});
      erroneous_config = true;
      continue;
    }
    
    if(!directive_done && directive.length) directive_done = true;
    if(!directive_done) continue;
  
    if(arg.length) args.push(arg); 
  
    let list = statements;
    
    for(let x = 0; x < block_stack.length; ++x) {
      if(block_mode === undefined && is_new_block && x === block_stack.length-1) {
        list.content.push({type:"BLOCK",directive,args,filename,line:(j+1),col:first_char_pos,snippet:line,content: []});
      }
  
      list = list.content[list.content.length-1];
    }
  
    if(block_mode === undefined) continue;
  
    list.content.push({ type: "DIRECTIVE" ,directive, args, filename, line:(j+1),col:first_char_pos,snippet:line });
    //console.error(directive);
    //console.error(args);
  }
  
  if(block_stack.length) {
    errors.content.push({filename, line: (data.length), col: (data[data.length-1].length+1), msg: "blocks still left on the stack"});
  }
  
  return (errors.content.length?errors:statements);
}

//console.log(util.inspect(parse_file(process.argv[2]?process.argv[2]:'test.conf'), false, null, true));

const escape_string = function escape_string(str) {
  return util.inspect(str);
  
  let res = str.replace(/\\/g, '\\\\');

  if(res.indexOf("'") !== -1 && res.indexOf('"') === -1) {
    return '"' + res + '"';
  } else if(res.indexOf("'") !== -1 && res.indexOf('"') !== -1) {
    return "'" + res.replace(/\x27/g, "\\'") + "'";
  } else {
    return "'" + res + "'";
  }
}

let Directives = {
  "PidFile": {
    callback: function(config, bstack, _filename) {
      if(bstack.length) return {"type": "ERROR", "msg": "directive not allowed inside blocks"};
      if(_filename === undefined) return {"type": "ERROR", "msg": "no filename given"};

      let filename = resolve_envvars(_filename);
      if(filename instanceof Array) return filename;
    
      config.pidfile = filename;
    
      return {"type": "GOOD"};
    },
    config: "local"
  },
  "Timeout": {
    callback: function(config, bstack, seconds) {
      if(seconds === undefined) return {"type": "ERROR", "msg": "no time duration given"};
      if(/^[0-9]+(?:\.[0-9]+)?$/.test(seconds)) {
        config.timeout = parseInt(seconds);
    
        return {"type": "GOOD"};
      } else {
        return {"type": "ERROR", "msg": "not a valid positive integer: " + escape_string(seconds)};
      }
    },
    config: "local"
  },
  "User": {
    callback: function(config, bstack, _username) {
      if(bstack.length) return {"type": "ERROR", "msg": "not allowed inside blocks"};
      if(_username === undefined) return {"type": "ERROR", "msg": "username argument missing"};
      let username = resolve_envvars(_username);
      if(username instanceof Array) return username;

      config.username = username;
    
      return {"type": "GOOD"};
    },
    config: "local"
  },
  "Group": {
    callback: function(config, bstack, _group_name) {
      if(bstack.length) return {"type": "ERROR", "msg": "not allowed inside blocks"};
      if(_group_name === undefined) return {"type": "ERROR", "msg": "group name argument missing"};
      let group_name = resolve_envvars(_group_name);
      if(group_name instanceof Array) return group_name;

      config.groupname = group_name;
    
      return {"type": "GOOD"};
    },
    config: "local"
  },
  "ErrorLog": {
    callback: function(config, bstack, _filename) {
      if(_filename === undefined) return {"type": "ERROR", "msg": "must specify filename"};
      let filename = resolve_envvars(_filename);
      if(filename instanceof Array) return filename;

      config.logs = config.logs||{};
      config.logs.error = config.logs.error||[];
      config.logs.error.push(filename);
      
      return {"type": "GOOD"};
    },
    config: "local",
  },
  "Listen": {
    callback: function(config, bstack, port) {
      if(bstack.length) return {"type": "ERROR", "msg": "not allowed inside blocks"};
      if(port === undefined) return {"type": "ERROR", "msg": "must specify a port number"};
      if(/^[0-9]+(?:\.[0-9]+)?$/.test(port)) {
        let num = parseInt(port);
        
        if(num >= 65536) {
          return {"type": "ERROR", "msg": "not a valid port number: " + num};
        } else if(num === 0 || num >= 49152) {
          return {"type": "ERROR", "msg": "not a listenable port number: " + num};
        }

        config.port = num;
      
        return {"type": "GOOD"};
      } else {
        return {"type": "ERROR", "msg": "not a valid positive integer: " + escape_string(seconds)};
      }
    },
    config: "local",
  },
  "Include": {
    callback: function(config, bstack, _filename) {
      let pattern = resolve_envvars(_filename);
      if(pattern instanceof Array) return pattern;
      
      let dir = pattern.substr(0, pattern.lastIndexOf('/'));
      let filecard = pattern.substr(pattern.lastIndexOf('/')+1);
      let fileregex = new RegExp(filecard.replace(/\*/g, '[^/]+').replace(/\./g, '\\.') + "$");
    
      let files = fs.readdirSync(dir);
      
      let error = false;

      for(let file of files) {
        if(fileregex.test(file)) {
          let filename = dir + "/" + file;
          let config_frames = parse_file(filename);
        
          if(config_frames.type === "ERROR") {
            return {"type": "ERROR", "msg": (filename + ": " + config_frames.content[0].msg)};
          }

          let _error = execute_frames(config, bstack, config_frames);
          if(_error) error = true;
        }
      }

      if(error) return true;

      return {"type": "GOOD"};
    },
    config: "global",
  },
  "Require": {
    callback: function(config, bstack, ...opts) {
      if(opts.length === 0) return {"type": "ERROR", "msg": "must have at least one requirement"};

      config.grant_ip = config.grant_ip||[];
      config.deny_ip = config.deny_ip||[];

      if(opts.length === 2 && ['granted', 'denied'].indexOf(opts[1].toLowerCase()) !== -1) {
        let id = opts[0].toLowerCase();  // Some form of client identifier
        let mode = opts[1].toLowerCase();
        
        if(mode === "granted") {
          if(id === "local") {
            if(config.grant_ip.indexOf("::1") === -1) config.grant_ip.push("::1");
            if(config.grant_ip.indexOf("127.0.0.0/8") === -1) config.grant_ip.push("127.0.0.0/8");
          } else if(id === "all") {
            delete config.deny_ip;
            delete config.grant_ip;
          } else if(net.isIP(id)) {
            config.grant_ip.push(id);
          } else if(net.isIP(id.substr(0, id.lastIndexOf('/')))) {
            let ipv = net.isIP(id.substr(0, id.lastIndexOf('/')));
            let sn = parseInt(id.substr(id.lastIndexOf('/')+1))

            if(ipv === 4 && (sn > 32 || sn <= 0)) return {"type": "ERROR", "msg": "invalid subnet: " + escape_string(opt)};
            if(ipv === 6 && (sn > 128 || sn <= 0)) return {"type": "ERROR", "msg": "invalid subnet: " + escape_string(opt)};
            
            if(ipv === 4) {
              let block = 0;
              id.substr(0, id.lastIndexOf('/')).split('.').forEach(item=>{
                block <<= 8;
                block |= parseInt(item);
              });

              block >>= 32-sn;
              block <<= 32-sn;

              let subnet = ((block>>24)&0xFF) + "." +
                           ((block>>16)&0xFF) + "." +
                           ((block>> 8)&0xFF) + "." +
                           ((block    )&0xFF) + "/" + sn;

              if(config.grant_ip.indexOf(subnet) === -1) config.grant_ip.push(subnet);
            } else {
              config.grant_ip.push(id);
            }
          } else {
            return {"type": "ERROR", "msg": "invalid IP address: " + escape_string(opt)};
          }
        } else {
          if(id === "local") {
            if(config.deny_ip.indexOf("::1") === -1) config.deny_ip.push("::1");
            if(config.deny_ip.indexOf("127.0.0.0/8") === -1) config.deny_ip.push("127.0.0.0/8");
          } else if(id === "all") {
            config.deny_ip = ["0.0.0.0/0"];
            delete config.grant_ip;
          } else if(net.isIP(id)) {
            config.deny_ip.push(id);
          } else if(net.isIP(id.substr(0, id.lastIndexOf('/')))) {
            let ipv = net.isIP(id.substr(0, id.lastIndexOf('/')));
            let sn = parseInt(id.substr(id.lastIndexOf('/')+1))

            if(ipv === 4 && (sn > 32 || sn <= 0)) return {"type": "ERROR", "msg": "invalid subnet: " + escape_string(opt)};
            if(ipv === 6 && (sn > 128 || sn <= 0)) return {"type": "ERROR", "msg": "invalid subnet: " + escape_string(opt)};
            
            if(ipv === 4) {
              let block = 0;
              id.substr(0, id.lastIndexOf('/')).split('.').forEach(item=>{
                block <<= 8;
                block |= parseInt(item);
              });

              block >>= 32-sn;
              block <<= 32-sn;

              let subnet = ((block>>24)&0xFF) + "." +
                           ((block>>16)&0xFF) + "." +
                           ((block>> 8)&0xFF) + "." +
                           ((block    )&0xFF) + "/" + sn;

              if(config.deny_ip.indexOf(subnet) === -1) config.deny_ip.push(subnet);
            } else {
              config.deny_ip.push(id);
            }
          } else {
            return {"type": "ERROR", "msg": "invalid IP address: " + escape_string(opt)};
          }
        }
      } else if(opts.length === 2 && ['granted', 'denied'].indexOf(opts[1].toLowerCase()) === -1) {
        return {"type": "ERROR", "msg": "unknown action: " + escape_string(opts[1])};
      } else {
        for(let opt of opts) {
          if(opt.toLowerCase() === "local") {
            config.grant_ip.push("::1");
            config.grant_ip.push("127.0.0.0/8");
          } else if(net.isIP(opt)) {
            config.grant_ip.push(opt);
          } else if(net.isIP(opt.substr(0, opt.lastIndexOf('/')))) {
            let ipv = net.isIP(opt.substr(0, opt.lastIndexOf('/')));
            let sn = parseInt(opt.substr(opt.lastIndexOf('/')+1))

            if(ipv === 4 && (sn > 32 || sn <= 0)) return {"type": "ERROR", "msg": "invalid subnet: " + escape_string(opt)};
            if(ipv === 6 && (sn > 128 || sn <= 0)) return {"type": "ERROR", "msg": "invalid subnet: " + escape_string(opt)};
            
            if(ipv === 4) {
              let block = 0;
              opt.substr(0, opt.lastIndexOf('/')).split('.').forEach(item=>{
                block <<= 8;
                block |= parseInt(item);
              });

              block >>= 32-sn;
              block <<= 32-sn;

              let subnet = ((block>>24)&0xFF) + "." +
                           ((block>>16)&0xFF) + "." +
                           ((block>> 8)&0xFF) + "." +
                           ((block    )&0xFF) + "/" + sn;

              if(config.grant_ip.indexOf(subnet) === -1) config.grant_ip.push(subnet);
            } else {
              config.grant_ip.push(opt);
            }
          } else {
            return {"type": "ERROR", "msg": "invalid IP address: " + escape_string(opt)};
          }
        }
      }

      return {"type": "GOOD"};
    },
    config: "local",
  },
  "ErrorDocument": {
    callback: function(config, bstack, code, _filename) {
      if(code === undefined) return {"type": "ERROR", "msg": "two arguments required: Status Code and Filename"};
      if(_filename === undefined) return {"type": "ERROR", "msg": "filename argument not specified"};

      if(STATUS_CODES[code] === undefined) return {"type": "ERROR", "msg": "no such status code: " + code};
      let filename = resolve_envvars(_filename);
      if(filename instanceof Array) return filename;

      config.webpages = config.webpages||{};
      config.webpages[code] = filename;
      
      return {"type": "GOOD"};
    },
    config: "local",
  },
  "ServerTokens": {
    callback: function(config, bstack, _opt) {
      if(bstack.length) return {"type": "ERROR", "msg": "not allowed inside blocks"};
      let opt = _opt.toLowerCase();
      config.headers = config.headers||{};

      if(opt === "full") {
        config.headers["server"] = AMETHYST_PRODUCT + "/" + AMETHYST_VERSION + " (" + AMETHYST_PLATFORM + ")";
      } else if(opt === "min" || opt === "minimal") {
        config.headers["server"] = AMETHYST_PRODUCT + "/" + AMETHYST_VERSION;
      } else if(opt === "prod" || opt === "productonly") {
        config.headers["server"] = AMETHYST_PRODUCT;
      } else if(opt === "gone" && config.headers["server"]) {
        delete config.headers["server"];
      } else {
        return {"type": "ERROR", "msg": "unknown token type: " + escape_string(opt)};
      }
      
      return {"type": "GOOD"};
    },
    config: "local",
  },
  "Header": {
    callback: function(config, bstack, _header, _value) {
      if(_header === undefined) return {"type": "ERROR", "msg": "missing header-value arguments"};
      if(_value === undefined) return {"type": "ERROR", "msg": "missing value argument"};
      
      let value = resolve_envvars(_value);
      let header = _header.toLowerCase();
      if(value instanceof Array) return value;
 
      config.headers = config.headers||{};

      if(DISALLOWED_CUSTOM_HEADERS.indexOf(header) === -1) {
        config.headers[header] = value;
      } else if(header === "server") {
        return {"type": "ERROR", "msg": "not allowed to set server header; use ServerTokens directive"};
      } else {
        return {"type": "ERROR", "msg": "not allowed to set header: " + escape_string(header)};
      }
      
      return {"type": "GOOD"};
    },
    config: "local",
  },
  "RemoteHostMode": {
    callback: function(config, bstack, _mode) {
      if(bstack.length) return {"type": "ERROR", "msg": "not allowed inside blocks"};
      if(_mode === undefined) return {"type": "ERROR", "msg": "missing argument: mode"};
      let mode = resolve_envvars(_mode);
      if(mode instanceof Array) return mode;
      mode = mode.toLowerCase();
      
      if(mode === "proxy") {
        config.proxy = true;
      } else if(mode === "head") {
        config.proxy = false;
      } else {
        return {"type": "ERROR", "msg": "unrecognized mode: " + escape_string(mode)};
      }
      
      return {"type": "GOOD"};
    },
    config: "local",
  },
  "AccessLogFormat": {
    callback: function(config, bstack, format, name) {
      if(bstack.length) return {"type": "ERROR", "msg": "not allowed inside blocks"};
      if(format === undefined) return {"type": "ERROR", "msg": "missing format string"};
      if(name === undefined) return {"type": "ERROR", "msg": "no name given for format string"};
      if(name.length === 0) return {"type": "ERROR", "msg": "name must be longer than zero characters"};
      
      // TODO: Validate format argument

      config.logs = config.logs||{};
      config.logs.access_format = config.logs.access_format||{};

      config.logs.access_format[name] = format;
      
      return {"type": "GOOD"};
    },
    config: "local",
  },
  "TimeFormat": {
    callback: function(config, bstack, format) {
      if(bstack.length) return {"type": "ERROR", "msg": "not allowed inside blocks"};
      if(format === undefined) return {"type": "ERROR", "msg": "missing format string"};

      // TODO: Validate format argument

      config.logs = config.logs||{};
      config.logs.timefmt = format;
      
      return {"type": "GOOD"};
    },
    config: "local",
  },
  "TimeZone": {
    callback: function(config, bstack, _opt, arg2) {
      if(bstack.length) return {"type": "ERROR", "msg": "not allowed inside blocks"};
      if(_opt === undefined) return {"type": "ERROR", "msg": "at least one argument required"};
      let opt = _opt.toLowerCase();

      config.logs = config.logs||{};
      
      if(opt === "system") {
        let d = new Date();
        let z = d.getTimezoneOffset();
        let name = d.toLocaleTimeString('en-us', {timeZoneName:'short'}).split(' ')[2];

        config.logs.tz =  {name};
        
        let tzstr = "";
        tzstr += (z>=0?'-':'+');  // backwards, I know. It's stupid.
        tzstr += (Math.floor(Math.abs(z)/60)<10?("0"+Math.floor(Math.abs(z)/60)):Math.floor(Math.abs(z)/60));
        tzstr += (Math.floor(Math.abs(z)%60)<10?("0"+Math.floor(Math.abs(z)%60)):Math.floor(Math.abs(z)%60));

        config.logs.tz.time = tzstr;
      } else if(opt === "z" || opt === "zulu") {
        config.logs.tz = {name:"UTC", time:"+0000"};
      } else if(arg2 && /^[a-z]{3}$/.test(opt) && /^[\+-][0-9]{2}:?[0-9]{2}$/.test(arg2)) {
        config.logs.tz =  {name: opt, time: arg2.replace(':', '')};
      } else if(arg2) {
        return {"type": "ERROR", "msg": "invalid timezone spec: " + escape_string(opt.toUpperCase() + " " + arg2)};
      } else {
        return {"type": "ERROR", "msg": "invalid timezone string: " + escape_string(opt.toUpperCase())};
      }

      return {"type": "GOOD"};
    },
    config: "local",
  },
  "SetEnv": {
    callback: function(config, bstack, _key, value) {
      if(_key === undefined) return {"type": "ERROR", "msg": "no environment variable name specified"};
      if(value === undefined) return {"type": "ERROR", "msg": "no environment variable value specified"};
      let key = _key.toUpperCase();

      if(/^[A-Z_][A-Z_0-9]*$/.test(key)) {
        process.env[key] = value;
      } else {
        return {"type": "ERROR", "msg": "invalid environment variable name: " + escape_string(key)};
      }

      return {"type": "GOOD"};
    },
    config: "local",
  },
  "UnsetEnv": {
    callback: function(config, bstack, _key, value) {
      if(_key === undefined) return {"type": "ERROR", "msg": "no environment variable name specified"};
      if(value === undefined) return {"type": "ERROR", "msg": "no environment variable value specified"};
      let key = _key.toUpperCase();

      if(/^[A-Z_][A-Z_0-9]*$/.test(key) && process.env[key] !== undefined) {
        delete process.env[key];
      } else {
        return {"type": "ERROR", "msg": "invalid environment variable name: " + escape_string(key)};
      }

      return {"type": "GOOD"};
    },
    config: "local",
  },
  "LoadModule": {
    callback: function(config, bstack, _priority, _filename) {
      if(_priority === undefined) return {"type": "ERROR", "msg": "expected priority and path to module src"};
      if(_filename === undefined) return {"type": "ERROR", "msg": "missing path to src file"};
      let filename = resolve_envvars(_filename);
      if(filename instanceof Array) return filename;
      
      if(!path.isAbsolute(filename)) filename = path.join(process.env.PWD + "/" + filename);
      
      let priority;

      if(/^[\+-]?[0-9]+(?:\.[0-9]+)?$/.test(_priority)) {
        priority = parseFloat(_priority);
      } else {
        return {"type": "ERROR", "msg": "invalid priority: not a number: " + escape_string(_priority)};
      }

      let mod = {};
      
      try {
        mod = require(filename);
      } catch(err) {
        if(err.constructor.name !== "Error") {
          return {"type": "ERROR", "msg": "uncaught " + err.constructor.name + " while loading module: " + escape_string(filename) + ": " + err.messsage};
        } else if(err.code === "MODULE_NOT_FOUND") {
          return {"type": "ERROR", "msg": "no such module: " + escape_string(filename)};
        } else if(err.code === "EISDIR") {
          return {"type": "ERROR", "msg": "requested path is directory: " + escape_string(filename)};
        } else if(err.code === "EACCESS") {
          return {"type": "ERROR", "msg": "insufficient read privileges: " + escape_string(filename)};
        }
      }
      
      let module_name = mod.name;
      if(modules.indexOf(module_name) !== -1) return {"type": "ERROR", "msg": "cannot load module " + escape_string(module_name) + ": module already loaded"};
      
      modules.push(module_name);
      config[module_name] = {};
      
      let load_events = [];

      if(mod.constructor.name === "Object") { 
        if(mod.directives !== undefined && mod.directives !== null && mod.directives.constructor.name === "Object") {
          for(let directive in mod.directives) {
            if(Directives[directive] === undefined) {
              modules_from_directives[directive] = module_name;
              if(mod.directives[directive] instanceof Function) {
                Directives[directive] = {
                  callback: function() {
                    try {
                      return mod.directives[directive].apply(null, arguments);
                    } catch(err) {
                      return {"type": "ERROR", "msg": "Uncaught " + err.constructor.name + ": " + err.message + " " + err.stack.split('\n')[1].trim()};
                    }
                  },
                  config: "local"
                }
              } else if(mod.directives[directive] instanceof Object) {
                let cb = function(){return {"type": "ERROR", "msg": "not implemented"};};
                if(mod.directives[directive].callback instanceof Function) {
                  cb = mod.directives[directive].callback;
                }
                
                Directives[directive] = {
                  callback: function() {
                    try {
                      return cb.apply(null, arguments);
                    } catch(err) {
                      return {"type": "ERROR", "msg": "Uncaught " + err.constructor.name + ": " + err.message + " " + err.stack.split('\n')[1].trim()};
                    }
                  },
                  config: (mod.directives[directive].config||"local")
                }
              }
            }
          }
        }

        if(mod.blocks !== undefined && mod.blocks !== null && mod.blocks.constructor.name === "Object") {
          for(let block in mod.blocks) {
            if(Blocks[block] === undefined) {
              modules_from_blocks[block] = module_name;
              if(mod.blocks[block] instanceof Function) {
                Blocks[block] = {
                  callback: function() {
                    try {
                      return mod.blocks[block].apply(null, arguments);
                    } catch(err) {
                      return {"type": "ERROR", "msg": "Uncaught " + err.constructor.name + ": " + err.message + " " + err.stack.split('\n')[1].trim()};
                    }
                  }
                }
              } else if(mod.blocks[block] instanceof Object) {
                let cb = function(){return {"type": "ERROR", "msg": "not implemented"};};
                if(mod.blocks[block].callback instanceof Function) {
                  cb = mod.blocks[block].callback;
                }
                
                Block[block] = {
                  callback: function() {
                    try {
                      return cb.apply(null, arguments);
                    } catch(err) {
                      return {"type": "ERROR", "msg": "Uncaught " + err.constructor.name + ": " + err.message + " " + err.stack.split('\n')[1].trim()};
                    }
                  }
                }
              }
            }
          }
        }

        if(mod.events !== undefined && mod.events !== null && mod.events.constructor.name === "Object") {
          for(let event in mod.events) {
            if(event === "load") {
              if(mod.events[event] instanceof Function) {
                load_events.push({
                  callback: function() {
                    try {
                      return mod.events[event].apply(null, arguments);
                    } catch(err) {
                      return {"type": "ERROR", "msg": "Uncaught " + err.constructor.name + ": " + err.message + " " + err.stack.split('\n')[1].trim()};
                    }
                  },
                  config: "local"
                });
              } else if(mod.events[event] instanceof Object) {
                load_events.push({
                  callback: function() {
                    try {
                      return mod.events[event].callback.apply(null, arguments);
                    } catch(err) {
                      return {"type": "ERROR", "msg": "Uncaught " + err.constructor.name + ": " + err.message + " " + err.stack.split('\n')[1].trim()};
                    }
                  },
                  config: mod.events[event].config||"local"
                });
              }
            } else if(mod.events[event] instanceof Function) {
              Events.register(module_name, priority, event, {
                callback: (function() {
                  try {
                    return mod.events[event].apply(null, arguments);
                  } catch(err) {
                    return {"type": "ERROR", "msg": "Uncaught " + err.constructor.name + ": " + err.message + " " + err.stack.split('\n')[1].trim()};
                  }
                }),
                config: "local"
              });
            } else if(mod.events[event] instanceof Object) {
              Events.register(module_name, priority, event, {
                callback: (function() {
                  try {
                    return mod.events[event].callback.apply(null, arguments);
                  } catch(err) {
                    return {"type": "ERROR", "msg": "Uncaught " + err.constructor.name + ": " + err.message + " " + err.stack.split('\n')[1].trim()};
                  }
                }),
                config: mod.events[event].config||"local"
              });
            }
          }
        }
      } else {
        return {"type": "ERROR", "msg": "module " + escape_string(filename) + " exported an instance of " + mod.constructor.name + " instead of an instance of Object"};
      }
      
      let load_errors = [];

      for(let load_event of load_events) {
        let res;

        if(load_event.config === "local") {
          res = load_event.callback.apply(null, [config[module_name]]);
        } else {
          res = load_event.callback.apply(null, [config]);
        }

        res = res||{"type": "GOOD"};

        if(res.type === "ERROR") {
          load_errors.push(res);
        }
      }

      if(load_errors.length) return load_errors;
    },
    config: "global",
  }
}

let modules_from_directives = {
  "PidFile": "core",
  "Timeout": "core",
  "User": "core",
  "Group": "core",
  "ErrorLog": "core",
  "Listen": "core",
  "Include": "core",
  "Require": "core",
  "ErrorDocument": "core",
  "ServerTokens": "core",
  "Header": "core",
  "RemoteHostMode": "core",
  "AccessLogFormat": "core",
  "TimeFormat": "core",
  "TimeZone": "core",
  "SetEnv": "core",
  "UnsetEnv": "core",
  "LoadModule": "core"
}

let modules = ["core"];

let Blocks = {
  "Endpoint": function(config, bstack, frames) {
    let endpoints = frames.args;

    let config_obj = {};
    for(let module of modules) config_obj[module] = {};
    let result = execute_frames(config_obj, [...bstack, "Endpoint"], frames);

    config.core.endpoints = config.core.endpoints||{};

    for(let endpoint of endpoints) {
      config.core.endpoints[endpoint] = config.core.endpoints[endpoint]||{};
      for(let module of modules) {
        config.core.endpoints[endpoint][module] = {
          ...config.core.endpoints[endpoint][module],
          ...config_obj[module]
        };
      }
    }

    return result;
  },
  "IfEnvEq": function(config, bstack, frames) {
    let args = frames.args;
    if(args.length < 2) return {"type": "ERROR", "msg": "expected environment variable name and assertive value"};

    let key = args[0].toUpperCase();
    let value = args[1];

    if(/^[A-Z_][A-Z_0-9]*$/.test(key)) {
      if(process.env[key] !== undefined && process.env[key] === value) {
        let result = execute_frames(config, [...bstack, "IfEnvEq"], frames);
        return result;
      }
    } else {
      return {"type": "ERROR", "msg": "invalid environment variable name: " + escape_string(key)};
    }
  },
  "IfEnvNeq": function(config, bstack, frames) {
    let args = frames.args;
    if(args.length < 2) return {"type": "ERROR", "msg": "expected environment variable name and assertive value"};

    let key = args[0].toUpperCase();
    let value = args[1];

    if(/^[A-Z_][A-Z_0-9]*$/.test(key)) {
      if(process.env[key] !== undefined && process.env[key] !== value) {
        let result = execute_frames(config, [...bstack, "IfEnvNeq"], frames);
        return result;
      }
    } else {
      return {"type": "ERROR", "msg": "invalid environment variable name: " + escape_string(key)};
    }
  },
  "IfEnv": function(config, bstack, frames) {
    let args = frames.args;
    if(args.length < 1) return {"type": "ERROR", "msg": "expected environment variable name"};

    let key = args[0].toUpperCase();

    if(/^[A-Z_][A-Z_0-9]*$/.test(key)) {
      if(process.env[key] !== undefined) {
        let result = execute_frames(config, [...bstack, "IfEnv"], frames);
        return result;
      }
    } else {
      return {"type": "ERROR", "msg": "invalid environment variable name: " + escape_string(key)};
    }
  },
  "IfNotEnv": function(config, bstack, frames) {
    let args = frames.args;
    if(args.length < 1) return {"type": "ERROR", "msg": "expected environment variable name"};

    let key = args[0].toUpperCase();

    if(/^[A-Z_][A-Z_0-9]*$/.test(key)) {
      if(process.env[key] === undefined) {
        let result = execute_frames(config, [...bstack, "IfNotEnv"], frames);
        return result;
      }
    } else {
      return {"type": "ERROR", "msg": "invalid environment variable name: " + escape_string(key)};
    }
  },
  "IfModule": function(config, bstack, frames) {
    let args = frames.args;
    if(args.length < 1) return {"type": "ERROR", "msg": "expected module name"};

    let key = args[0].toLowerCase();

    if(modules.indexOf(key) !== -1) {
      let result = execute_frames(config, [...bstack, "IfModule"], frames);
      return result;
    }

    return false;
  }
}

let Events = new EventStore();

////////////////////////////////////////////////////////////////////////////////
///////////////////////////// Register Core Events /////////////////////////////
////////////////////////////////////////////////////////////////////////////////

Events.register('core', 0x80, 'connection', {
  callback: function connection(config, {client, server}) {
    // enforce Require directive
    const match = match_ip_addresses;  // used as alias for easier reading

    for(let deny of config.deny_ip) {
      if(match(deny, client.ip)) {
        return {"type": "TCP", "action": "CLOSE"};
      }
    }
  
    let ip_granted = true;
    if(config.grant_ip.length) {
      ip_granted = false;

      for(let grant of config.grant_ip) {
        if(match(grant, client.ip)) {
          ip_granted = true;
        }
      }
    }

    if(ip_granted === false) {
      return {"type": "TCP", "action": "CLOSE"};
    }
  
    // All checks passed, IP address allowed
    return null;
  },
  config: "local"
});

let modules_from_blocks = {
  "Endpoint": "core",
  "IfEnvEq": "core",
  "IfEnvNeq": "core",
  "IfEnv": "core",
  "IfNotEnv": "core"
};

function execute_frames(config_obj, block_stack, config_frames) {
  if(config_frames.type === "ERROR") {
    for(let frame of config_frames.content) {
      if(frame.line) {
        console.error("error: " + frame.filename + ":" + frame.line + ":" + frame.col + ": " + frame.msg);
      } else {
        console.error("error: " + frame.filename + ": " + frame.msg);
      }
    }

    console.error("error: fatal: configuration parsing failed");
    return null;
  } else {
    let error = false;

    for(let frame of config_frames.content) {
      if(frame.type === "DIRECTIVE") {
        let dir = Directives[frame.directive];
        if(dir instanceof Object) {
          let method = dir.callback;
          let config_scope = dir.config;

          let result;
          
          if(config_scope === "local") result = method.apply(null, [config_obj[modules_from_directives[frame.directive]], block_stack, ...frame.args]);
          else result = method.apply(null, [config_obj, block_stack, ...frame.args]);
          
          if(typeof(result) === "object" && result.type === "ERROR") {
            console.error("error: " + frame.filename + ":" + frame.line + ":" + frame.col + ": " + frame.directive + ": " + result.msg);
            error = true;
            continue;
          } else if(result instanceof Array) {
            if(result[0] === "envvars") {
              for(let err of result.slice(1)) {
                console.error("error: " + frame.filename + ":" + frame.line + ": $" + err.envvar + ": " + err.msg);
              }
              error = true;
              continue;
            } else {
              for(let err of result) {
                console.error("error: " + frame.filename + ":" + frame.line + ":" + frame.col + ": " + frame.directive + ": " + err.msg);
              }
            }
          } else if(typeof(result) === "boolean" && result) {
            error = true;
            continue;
          }
        } else {
          console.error("error: " + frame.filename + ":" + frame.line + ":" + frame.col + ": no such directive: " + frame.directive);
          error = true;
          continue;
        }
      } else if(frame.type === "BLOCK") {
        let method = Blocks[frame.directive];

        if(method instanceof Function) {
          let result = method.apply(null, [config_obj, block_stack, frame]);
          if(typeof(result) === "object" && result.type === "ERROR") {
            console.error("error: " + frame.filename + ":" + frame.line + ":" + frame.col + ": <" + frame.directive + ">: " + result.msg);
            error = true;
            continue;
          } else if(typeof(result) === "boolean" && result) {
            error = true;
            continue
          }
        } else {
          console.error("error: no such block: <" + frame.directive + ">");
          error = true;
          continue;
        }
      }
    }

    return error;
  }
}

function get_config(config_file) {
  let config_frames = parse_file(config_file);
  let config_obj = {core:{}};
  
  global.parser = {};
  global.parser.parse_file = parse_file;
  global.parser.execute_frames = execute_frames;
  global.parser.escape_string = escape_string;
  global.parser.resolve_envvars = resolve_envvars;

  let error = execute_frames(config_obj, [], config_frames);
  
  if(!error) {
    let results = Events.dispatch("postconfig", null, config_obj);

    for(let result of results) {
      if(result.ret instanceof Object) {
        if(result.ret.type === "ERROR") {
          console.error("error: " + result.module + ": " + result.ret.msg);
          error = true;
          continue;
        }
      }
    }
  }

  delete global.parser;

  if(error !== false) {
    if(error === true) console.error("error: fatal: configuration execution failed");
    return {"type": "ERROR"};
  }

  return {"type": "CONFIG", "config": config_obj, "events": Events};
}

module.exports = get_config;

