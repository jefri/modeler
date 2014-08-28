;(function(_){


JEFRi.Stores = {};

_(JEFRi).extend({
  store: function(name, factory) {
    var e, store;
    try {
      store = factory();
      _(store.prototype).extend(JEFRi.EventDispatcher.prototype);
      return JEFRi.Stores[name] = store;
    } catch (_error) {
      e = _error;
      return console.warn("Could not build " + name + ": " + e);
    }
  }
});

var ObjectStore;

ObjectStore = (function() {
  var _sieve, _transactify;

  function ObjectStore(options) {
    this.settings = {
      version: "1.0",
      size: Math.pow(2, 16)
    };
    _.extend(this.settings, options);
    this._store = {};
    if (!this.settings.runtime) {
      throw {
        message: "LocalStore instantiated without runtime to reference."
      };
    }
  }

  ObjectStore.prototype._set = function(key, value) {
    return this._store[key] = value;
  };

  ObjectStore.prototype._get = function(key) {
    return this._store[key] || '{}';
  };

  ObjectStore.prototype.execute = function(type, transaction) {
    var d;
    transaction = _transactify(transaction);
    this.trigger("sending", transaction);
    this["do_" + type](transaction);
    this.settings.runtime.expand(transaction);
    d = Q.defer();
    d.resolve(transaction);
    return d.promise;
  };

  ObjectStore.prototype.get = function(transaction) {
    return this.execute('get', transaction);
  };

  ObjectStore.prototype.persist = function(transction) {
    return this.execute('persist', transction);
  };

  ObjectStore.prototype.do_persist = function(transaction) {
    var entity;
    return transaction.entities = (function() {
      var _i, _len, _ref, _results;
      _ref = transaction.entities;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entity = _ref[_i];
        _results.push(this._save(entity));
      }
      return _results;
    }).call(this);
  };

  ObjectStore.prototype._save = function(entity) {
    entity = _(this._find(entity)).extend(entity);
    this._set(this._key(entity), JSON.stringify(entity));
    this._type(entity._type, entity._id);
    return entity;
  };

  ObjectStore.prototype.do_get = function(transaction) {
    var entity, ents,
      _this = this;
    ents = (function() {
      var _i, _len, _ref, _results;
      _ref = transaction.entities;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        entity = _ref[_i];
        _results.push(this._lookup(entity));
      }
      return _results;
    }).call(this);
    ents = _.flatten(ents);
    transaction.entities = _.uniq(_(ents).filter(function(it) {
      return it;
    }), false, function(it) {
      return it._type + '.' + it[_this.settings.runtime.definition(it._type).key];
    });
    return transaction;
  };

  ObjectStore.prototype._find = function(entity) {
    return JSON.parse(this._get(this._key(entity)));
  };

  ObjectStore.prototype._lookup = function(spec) {
    var def, end, entity, give, i, id, j, name, property, related, relationship, results, take, _i, _j, _len, _len1, _ref, _ref1,
      _this = this;
    def = this.settings.runtime.definition(spec._type);
    results = (function() {
      var _i, _len, _ref, _results;
      _ref = _.keys(this._type(spec._type));
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        id = _ref[_i];
        _results.push(JSON.parse(this._get(this._key(spec, id))));
      }
      return _results;
    }).call(this);
    if (results.length === 0) {
      return;
    }
    if (def.key in spec) {
      results = [results[spec[def.key]]];
    }
    _ref = def.properties;
    for (name in _ref) {
      property = _ref[name];
      if (name in spec && name !== def.key) {
        results = _(results).filter(_sieve(name, property, spec[name]));
      }
    }
    _ref1 = def.relationships;
    for (name in _ref1) {
      relationship = _ref1[name];
      if (name in spec) {
        give = [];
        take = [];
        for (i = _i = 0, _len = results.length; _i < _len; i = ++_i) {
          entity = results[i];
          related = (function() {
            var relspec;
            relspec = _.extend({}, spec[name], {
              _type: relationship.to.type
            });
            relspec[relationship.to.property] = entity[relationship.property];
            return _this._lookup(relspec) || [];
          })();
          if (related.length) {
            give.push(related);
          }
        }
        take.reverse();
        for (_j = 0, _len1 = take.length; _j < _len1; _j++) {
          i = take[_j];
          j = i + 1;
          end = results[j(til(results.length))];
          results = results.slice(0, +i + 1 || 9e9);
          [].push.apply(results, end);
        }
        [].push.apply(results, give);
      }
    }
    return results;
  };

  ObjectStore.prototype._type = function(type, id) {
    var list;
    if (id == null) {
      id = null;
    }
    list = JSON.parse(this._get(type) || "{}");
    if (id) {
      list[id] = "";
      this._set(type, JSON.stringify(list));
    }
    return list;
  };

  ObjectStore.prototype._key = function(entity, id) {
    var _type;
    if (id == null) {
      id = entity._id;
    }
    _type = entity._type;
    return "" + _type + "/" + id;
  };

  _sieve = function(name, property, spec) {
    var i, s;
    if (_.isNumber(spec)) {
      if (spec % 1 === 0) {
        spec = ['=', spec];
      } else {
        spec = [spec, 8];
      }
    }
    if (_.isString(spec)) {
      spec = ['REGEX', '.*' + spec + '.*'];
    }
    if (!spec) {
      spec = ['=', void 0];
    }
    if (!_.isArray(spec)) {
      throw {
        message: "Lookup specification is invalid (in LocalStore::_sieve).",
        name: name,
        property: property,
        spec: spec
      };
    }
    if (_.isNumber(spec[0])) {
      return function(entity) {
        return Math.abs(entity[name] - spec[0]) < Math.pow(2, -spec[1]);
      };
    }
    if (_.isArray(spec[0])) {
      spec[i] = (function() {
        var _i, _len, _results;
        _results = [];
        for (i = _i = 0, _len = spec.length; _i < _len; i = ++_i) {
          s = spec[i];
          _results.push(_sieve(name, property, spec[i]));
        }
        return _results;
      })();
      return function(entity) {
        var filter, _i, _len;
        for (_i = 0, _len = spec.length; _i < _len; _i++) {
          filter = spec[_i];
          if (!filter(entity)) {
            return false;
          }
        }
        return true;
      };
    }
    switch (spec[0]) {
      case "=":
        return function(entity) {
          return entity[name] === spec[1];
        };
      case "<=":
        return function(entity) {
          return entity[name] <= spec[1];
        };
      case ">=":
        return function(entity) {
          return entity[name] >= spec[1];
        };
      case "<":
        return function(entity) {
          return entity[name] < spec[1];
        };
      case ">":
        return function(entity) {
          return entity[name] > spec[1];
        };
      case "REGEX":
        return function(entity) {
          return ("" + entity[name]).match(spec[1]);
        };
      default:
        return function(entity) {
          var field;
          while (field = spec.shift) {
            if (entity[name] === field) {
              return true;
            }
          }
          return false;
        };
    }
  };

  _transactify = function(transaction) {
    if (!_(transaction.encode).isFunction()) {
      transaction = new JEFRi.Transaction(transaction);
    }
    return transaction.encode();
  };

  return ObjectStore;

})();

JEFRi.store('ObjectStore', function() {
  return ObjectStore;
});

var LocalStore,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

LocalStore = (function(_super) {
  __extends(LocalStore, _super);

  function LocalStore(options) {
    LocalStore.__super__.constructor.call(this, options);
  }

  LocalStore.prototype._set = function(key, value) {
    return localStorage[key] = value;
  };

  LocalStore.prototype._get = function(key) {
    return localStorage[key] || '{}';
  };

  LocalStore.prototype._key = function(entity, id) {
    if (id == null) {
      id = entity._id;
    }
    return LocalStore.__super__._key.call(this, entity, id).replace('/', '.');
  };

  return LocalStore;

})(JEFRi.Stores.ObjectStore);

JEFRi.store("LocalStore", function() {
  return LocalStore;
});

var PostStore,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

PostStore = (function() {
  function PostStore(options) {
    this._send = __bind(this._send, this);
    this.settings = {
      version: "1.0",
      size: Math.pow(2, 16)
    };
    _.extend(this.settings, options);
    if (!this.settings.runtime) {
      throw {
        message: "LocalStore instantiated without runtime to reference."
      };
    }
    if (this.settings.remote) {
      _(this).extend({
        get: function(transaction) {
          var url;
          url = "" + this.settings.remote + "get";
          return this._send(url, transaction, 'getting', 'gotten');
        },
        persist: function(transaction) {
          var url;
          url = "" + this.settings.remote + "persist";
          return this._send(url, transaction, 'persisting', 'persisted');
        }
      });
    } else {
      this.get = this.persist = function(transaction) {
        transaction.entities = [];
        return Q.Defer().resolve(transaction).promise;
      };
    }
  }

  PostStore.prototype._send = function(url, transaction, pre, post) {
    var _this = this;
    return Request.post(url, {
      data: transaction.toString(),
      dataType: "application/json"
    }).then(function(data) {
      if (_(data).isString()) {
        data = JSON.parse(data);
      }
      _this.settings.runtime.expand(data);
      return data;
    });
  };

  return PostStore;

})();

_(PostStore.prototype).extend({
  execute: function(type, transaction) {
    return this[type](transaction);
  }
});

JEFRi.store("PostStore", function() {
  return PostStore;
});

/*
 FileStore
 https://github.com/DavidSouther/JEFRi

 Copyright (c) 2012 David Souther
 Licensed under the MIT license.
*/

var FileStore,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

FileStore = function() {
  var Q, fs, read, write;
  Q = require("q");
  fs = require("fs");
  write = Q.denodeify(fs.writeFile);
  read = Q.denodeify(fs.readFile);
  return FileStore = (function(_super) {
    var _checkDir;

    __extends(FileStore, _super);

    function FileStore(options) {
      var opts;
      opts = {
        directory: "./.jefri"
      };
      _(opts).extend(options);
      FileStore.__super__.constructor.call(this, opts);
      _checkDir(this.settings.directory);
      this.storage = this.settings.directory;
    }

    FileStore.prototype._set = function(key, value) {
      var path;
      path = this._buildPath(key);
      return fs.writeFileSync(path, value);
    };

    FileStore.prototype._get = function(key) {
      var path;
      path = this._buildPath(key);
      try {
        return fs.readFileSync(path);
      } catch (_error) {
        return "{}";
      }
    };

    FileStore.prototype._buildPath = function(key) {
      var path;
      key = key.split('/');
      path = "" + this.storage + "/" + key[0];
      _checkDir(path);
      if (key.length === 1) {
        key[1] = "list";
      }
      path = "" + path + "/" + key[1];
      return path;
    };

    _checkDir = function(directory) {
      var dir;
      try {
        dir = fs.statSync(directory);
      } catch (_error) {
        fs.mkdirSync(directory);
        dir = fs.statSync(directory);
      }
      if (!dir.isDirectory()) {
        throw "FileStorage target isn't a directory: " + directory;
      }
    };

    return FileStore;

  })(JEFRi.Stores.ObjectStore);
};

JEFRi.store("FileStore", FileStore);

this.JEFRi = JEFRi;
}).call(this, this._);
