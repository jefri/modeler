(function() {
  var controller, directive;

  angular.module('modeler', ['jefri', 'jquery', 'jsPlumb', 'ui']);

  controller = function($scope, model) {
    return model.on('ready', function() {
      $scope.context = model.context;
      try {
        return $scope.$digest();
      } catch (_error) {}
    });
  };

  controller.$inject = ['$scope', 'Model'];

  directive = function($) {
    return {
      restrict: 'E',
      template: $.template({
        replace: true
      }),
      controller: controller
    };
  };

  angular.module('modeler').directive('context', ['jQuery', directive]);

  directive = function($, model) {
    return {
      restrict: 'E',
      template: $.template("\#controls"),
      replace: true,
      scope: true,
      controller: !function($scope) {
        return $scope = {
          action: 'Load',
          storage: 'LocalStore',
          endpoint: 'http://localhost:3000/',
          contexts: [],
          contextName: "",
          add: function() {
            model.addEntity();
            return setTimeout(function() {
              return $scope.$apply();
            });
          },
          isRemoteStore: function() {
            return $scope.storage === 'PostStore';
          },
          isSaving: function() {
            return $scope.action === 'Save';
          },
          loadContexts: function() {
            return model.listContexts($scope.storage, {
              remote: $scope.endpoint
            }).then(!function(results) {
              $scope.contexts = results.entities;
              return setTimeout(function() {
                return $scope.$apply();
              });
            });
          },
          finish: function() {
            var name;
            name = $scope.isSaving() ? $scope.contextName || model.context.name() || "DEFAULT_CONTEXT" : $scope.contextId;
            model[$scope.action]($scope.storage, name, {
              remote: $scope.endpoint
            }).then(function() {
              return setTimeout(function() {
                return $scope.$apply();
              });
            });
            return $scope.showContext = false;
          },
          loadSample: function() {
            return model.load();
          },
          loadContext: function() {
            _.request.post("" + $scope.endpoint + "load/", {
              data: '{"context": "http://localhost:3000/entityContext.json"}',
              dataType: "application/json"
            });
            return setTimeout(function() {
              return $scope.$apply();
            });
          },
          "export": model["export"],
          exported: model["export"]()
        };
      }
    };
  };

  angular.module('modeler').directive('controls', ['jQuery', 'Model', 'JEFRi', directive]);

  describe("Directive", function() {
    beforeEach(module("modeler"));
    return describe("Controls", function(a) {
      return it("Has a New Entity button", function() {
        return inject(function($rootScope, $compile) {
          var element;
          element = "<controls></controls>";
          element = angular.element(element);
          element = $compile(element);
          return element = element($rootScope);
        });
      });
    });
  });

  controller = function($scope, Model) {
    var newPropertyId, newRelationshipId;
    newRelationshipId = newPropertyId = 1;
    $scope.addProperty = function() {
      return $scope.entity.properties(Model.runtime.build('Property', {
        name: "property_" + (newPropertyId++),
        type: 'string'
      }));
    };
    return $scope.addRelationship = function() {
      var relationship;
      relationship = Model.runtime.build('Relationship', {
        name: "relationship_" + (newRelationshipId++),
        type: 'has_a',
        from_property: $scope.entity._definition().key
      });
      relationship.from($scope.entity);
      return $scope.entity.relationships(relationship);
    };
  };

  angular.module('modeler').controller('Entity', ['$scope', 'Model', controller]);

  directive = function($, jsp) {
    return {
      restrict: 'E',
      template: $.template('.entity'),
      replace: true,
      controller: 'Entity',
      link: !function(scope, element) {
        return element.draggable({
          start: jsp.drag.start,
          drag: jsp.drag.drag,
          stop: jsp.drag.stop,
          stack: ".context .entity"
        }).resizable({
          handles: 'e'
        });
      }
    };
  };

  angular.module('modeler').directive('entity', ['jQuery', 'JSPlumb', directive]);

  directive = function($, Model) {
    return {
      restrict: 'E',
      template: $.template('.property'),
      replace: true
    };
  };

  angular.module('modeler').directive('property', ['jQuery', 'Model', directive]);

  directive = function($, jsp, jefri) {
    var plumb;
    plumb = !function(scope) {
      var from, label, to;
      if (!scope.relationship) {
        return;
      }
      from = ".entity." + (scope.relationship.from().name());
      to = ".entity." + (scope.relationship.to().name());
      if (scope.relationship.from_property()) {
        from = "#from ." + (scope.relationship.from_property());
      }
      if (scope.relationship.to_property()) {
        to = "#to ." + (scope.relationship.to_property());
      }
      if (scope.connector) {
        jsp.detach(scope.connector);
      }
      label = "" + (scope.relationship.from().name()) + "::" + (scope.relationship.name());
      return scope.connector = jsp.connect($(from), $(to));
    };
    return {
      restrict: 'E',
      template: $.template('.relationship'),
      replace: true,
      link: function(scope) {
        return setTimeout(function() {
          return plumb(scope);
        });
      },
      controller: function($scope) {
        var modified;
        modified = _.lock(function(field, value) {
          var back, from_property, to_property, to_rel, _find, _ref;
          _find = function(type) {
            var ent, found, _i, _len;
            found = jefri.find({
              _type: type,
              _id: value
            });
            for (_i = 0, _len = found.length; _i < _len; _i++) {
              ent = found[_i];
              if (ent.id() === value) {
                return ent;
              }
            }
          };
          if (angular.isArray(field)) {
            _ref = field, field = _ref[0], value = _ref[1];
          }
          if (value === void 0) {
            return;
          }
          switch (field) {
            case 'to_id':
              to_rel = _find('Entity');
              $scope.relationship.to(to_rel);
              break;
            case 'from_property':
              from_property = _find('Property');
              $scope.relationship.from_property(from_property.name());
              break;
            case 'to_property':
              to_property = _find('Property');
              $scope.relationship.to_property(to_property.name());
              break;
            case 'back':
              if (value === "") {
                $scope.relationship.back("");
              } else {
                back = _find('Relationship');
                $scope.relationship.back(back.name());
              }
          }
          try {
            $scope.$apply();
          } catch (_error) {}
          return plumb($scope);
        });
        $scope.relationship.on('modified', modified);
        $scope.relationship.on('destroying', function() {
          $scope.relationship.off('modified', modified);
          jsp.detach($scope.connector);
          return $scope.connector = null;
        });
        $scope.relationship.on('destroyed', function() {
          return $scope.relationship = null;
        });
        $scope.entity.on('destroyed', function() {
          return typeof $scope.relationship === "function" ? $scope.relationship(_destroy()) : void 0;
        });
        return $scope.relationship.to().on('destroyed', function() {
          var _ref;
          return (_ref = $scope.relationship) != null ? _ref._destroy() : void 0;
        });
      }
    };
  };

  angular.module('modeler').directive('relationship', ['jQuery', 'JSPlumb', 'JEFRi', directive]);

}).call(this);
