(function() {
  angular.module('jefri', []).factory('JEFRi', function() {
    return new JEFRi.Runtime("entityContext.json");
  });

}).call(this);

(function() {
  angular.module('jquery', []).factory('jQuery', function() {
    jQuery.noConflict();
    jQuery.template = function(tplSel) {
      return jQuery("\#templates #tplSel").html();
    };
    return jQuery;
  });

}).call(this);

(function() {
  var JSPlumb,
    __slice = [].slice;

  JSPlumb = function($) {
    var arrowCommon, arrows, color, connect, connections, detach, doDrag, draggable, hoverColor, plumb, plumbStyles, startDrag, stopDrag;
    color = 'gray';
    hoverColor = '#ec9f2e';
    arrowCommon = {
      foldback: 0.7,
      fillStyle: color,
      width: 14
    };
    arrows = [
      'Arrow', {
        location: 0.2
      }, arrowCommon
    ];
    plumbStyles = {
      Connector: ['Flowchart'],
      ConnectorZIndex: -5,
      PaintStyle: {
        strokeStyle: color,
        lineWidth: 2
      },
      EndpointStyle: {
        radius: 9,
        fillStyle: color
      },
      HoverPaintStyle: {
        strokeStyle: hoverColor
      },
      EndpointHoverStyle: {
        fillStyle: hoverColor
      },
      Anchors: ['RightMiddle', 'LeftMiddle'],
      Container: $({
        '.context': first
      }),
      RenderMode: 'svg'
    };
    plumb = jsPlumb.getInstance(plumbStyles);
    connections = [];
    connect = function(a, b, label) {
      var connection, overlays;
      overlays = [arrows];
      if (label) {
        overlays.push([
          'Label', {
            label: label,
            location: 0.1
          }
        ]);
      }
      connection = plumb.connect({
        source: a,
        target: b,
        overlays: overlays
      });
      connections.push(connection);
      return connection;
    };
    detach = function(conn) {
      var t;
      plumb.detach(conn);
      if ((t = connections.indexOf(conn)) > -1) {
        return connections[t(to(t))] = [];
      }
    };
    draggable = function() {
      var args, node, _i, _len, _results;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = args.length; _i < _len; _i++) {
        node = args[_i];
        _results.push(plumb.draggable(node));
      }
      return _results;
    };
    startDrag = function() {
      var connection, endpoint, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = connections.length; _i < _len; _i++) {
        connection = connections[_i];
        connection.setHoverPaintStyle(plumbStyles.PaintStyle);
        _results.push((function() {
          var _j, _len1, _ref, _results1;
          _ref = connection.endpoints;
          _results1 = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            endpoint = _ref[_j];
            _results1.push(endpoint.setHoverPaintStyle(plumbStyles.EndpointStyle));
          }
          return _results1;
        })());
      }
      return _results;
    };
    doDrag = function() {
      var connection, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = connections.length; _i < _len; _i++) {
        connection = connections[_i];
        connection.setHover(true, false);
        _results.push(connection.setHover(false, false));
      }
      return _results;
    };
    stopDrag = function() {
      var connection, endpoint, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = connections.length; _i < _len; _i++) {
        connection = connections[_i];
        connection.setHoverPaintStyle(plumbStyles.HoverPaintStyle);
        _results.push((function() {
          var _j, _len1, _ref, _results1;
          _ref = connection.endpoints;
          _results1 = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            endpoint = _ref[_j];
            _results1.push(endpoint.setHoverPaintStyle(plumbStyles.EndpointHoverStyle));
          }
          return _results1;
        })());
      }
      return _results;
    };
    return {
      connect: connect,
      detach: detach,
      draggable: draggable,
      drag: {
        start: startDrag,
        drag: doDrag,
        stop: stopDrag
      }
    };
  };

  angular.module('jsPlumb', ['jquery']).factory('JSPlumb', ['jQuery', JSPlumb]);

}).call(this);

(function() {
  var model,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  model = function(JEFRi) {
    var Model;
    Model = (function(_super) {
      __extends(Model, _super);

      function Model() {
        this.runtime = JEFRi;
        JEFRi.ready.then((function(_this) {
          return function() {
            _this.context = _this.runtime.build('Context');
            return _this.emit('ready', {});
          };
        })(this));
      }

      Model.prototype.load = function() {
        var host, hosts, router;
        router = JEFRi.build('Entity', {
          "name": "Router",
          "key": "router_id"
        });
        host = JEFRi.build('Entity', {
          "name": "Host",
          "key": "host_id"
        });
        this.context.entities([host, router]);
        router.properties([
          JEFRi.build('Property', {
            name: 'router_id',
            type: 'string'
          }), JEFRi.build('Property', {
            name: 'name',
            type: 'string'
          })
        ]);
        host.properties([
          JEFRi.build("Property", {
            name: "host_id",
            type: "string"
          }), JEFRi.build("Property", {
            name: "hostname",
            type: "string"
          }), JEFRi.build("Property", {
            name: "ip",
            type: "string"
          }), JEFRi.build("Property", {
            name: "mac",
            type: "string"
          }), JEFRi.build('Property', {
            name: 'router_id',
            type: 'string'
          })
        ]);
        router - many - (hosts = JEFRi.build('Relationship', {
          name: 'hosts',
          type: 'has_many',
          to_property: 'router_id',
          from_property: 'router_id',
          back: 'router'
        }));
        router - many - hosts.from(router);
        host - a - (router = JEFRi.build('Relationship', {
          name: 'router',
          type: 'has_a',
          to_property: 'router_id',
          from_property: 'router_id',
          back: 'hosts'
        }));
        host - a - router.from(host.to(router));
        router - many - hosts.to(host);
        return this.emit('ready', {});
      };

      Model.prototype.newEntityId = 1;

      Model.prototype.addEntity = function() {
        return this.context.entities(JEFRi.build('Entity', {
          name: "entity_" + (this.newEntityId++)
        }));
      };

      Model.prototype.listContexts = function(storeType, storeOptions) {
        var s, t;
        t = new window.JEFRi.Transaction();
        t.add({
          _type: 'Context'
        });
        storeOptions.runtime = JEFRi;
        s = new window.JEFRi.Stores[storeType](storeOptions);
        return s.execute('get', t);
      };

      Model.prototype.Save = function(store, name, storeOptions) {
        var entity, property, relationship, s, t, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
        this.context.name(name);
        t = new window.JEFRi.Transaction();
        t.add(this.context);
        _ref = this.context.entities();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          entity = _ref[_i];
          t.add(entity);
          _ref1 = entity.properties();
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            property = _ref1[_j];
            t.add(property);
          }
          _ref2 = entity.relationships();
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            relationship = _ref2[_k];
            t.add(relationship);
          }
        }
        storeOptions.runtime = JEFRi;
        s = new window.JEFRi.Stores[store](storeOptions);
        return s.execute('persist', t);
      };

      Model.prototype.Load = function(store, name, storeOptions) {
        var s, t;
        this.context.name(name);
        t = new window.JEFRi.Transaction();
        t.add({
          context_id: name,
          _type: 'Context',
          entities: {
            properties: {},
            relationships: {}
          }
        });
        storeOptions.runtime = JEFRi;
        s = new window.JEFRi.Stores[store](storeOptions);
        return s.execute('get', t).then((function(_this) {
          return function(results) {
            _this.context = results.entities[0];
            _this.context.entities();
            return _this.emit('ready', {});
          };
        })(this));
      };

      Model.prototype["export"] = function() {
        var _ref;
        return (_ref = this.context) != null ? _ref["export"]() : void 0;
      };

      return Model;

    })(window.JEFRi.EventDispatcher);
    return new Model();
  };

  angular.module('modeler').factory('Model', ['JEFRi', model]);

}).call(this);
