(function() {
  var Inline;

  Inline = function($) {
    return {
      restrict: 'E',
      template: '<span> <span ng:hide="editing" ng:click="edit()"> {{value}} </span> <span ng:show="editing"> <input type="text" name="value" ng:required ng-model="value" ui-event="{blur:\'save()\'}" /> </span> </span>',
      replace: true,
      scope: true,
      controller: function($scope) {
        $scope.editing = false;
        $scope.edit = function() {
          return $scope.editing = true;
        };
        return $scope.save = function() {
          return $scope.editing = false;
        };
      },
      link: function(scope, element, attrs) {
        scope.value = scope.entity[attrs.property]() || attrs["default"];
        return scope.$watch('value', function() {
          return scope.entity[attrs.property](scope.value);
        });
      }
    };
  };

  angular.module('modeler').directive('inline', ['jQuery', Inline]);

}).call(this);

(function() {
  var JefriProperty;

  JefriProperty = function($) {
    return {
      restrict: 'A',
      link: !function(scope, element, attrs) {
        var entity, linker, linkers, property, _ref;
        linkers = {};
        linkers.SELECT = (function(_this) {
          return function(entity, property) {
            var update;
            update = !function(val) {
              return element.find("option").filter(function() {
                var $this;
                $this = $(this);
                return $this.attr('value') === val || $this.text() === val;
              }).attr('selected', true);
            };
            element.change(function() {
              entity[property](element.val());
              try {
                return scope.$apply();
              } catch (_error) {}
            });
            entity.on('modified', !function(changed, value) {
              var _ref;
              if (_(changed).isArray()) {
                _ref = changed, changed = _ref[0], value = _ref[1];
              }
              if (changed === property) {
                return update(value);
              }
            });
            return setTimeout((function() {
              return update(entity[property]());
            }), 0);
          };
        })(this);
        linkers.INPUT = (function(_this) {
          return function(entity, property) {
            var update;
            if ('radio' === element.attr('type')) {
              update = function(val) {
                if (val === element.val()) {
                  return element.attr('checked', 'checked');
                }
              };
              element.change(function() {
                entity[property](element.val());
                try {
                  return scope.$apply();
                } catch (_error) {}
              });
              entity.on('modified', function(changed, value) {
                var _ref;
                if (angular.isArray(changed)) {
                  _ref = changed, changed = _ref[0], value = _ref[1];
                }
                if (changed === property) {
                  return update(value);
                }
              });
              setTimeout((function() {
                return update(entity[property]());
              }), 0);
              return;
            }
            return linkers.TEXTAREA(entity, property);
          };
        })(this);
        linkers.TEXTAREA = (function(_this) {
          return function(entity, property) {
            element.val(entity[property]());
            element.change(function() {
              return entity[property](element.val());
            });
            return entity.on('modified', function() {
              return element.val(entity[property]());
            });
          };
        })(this);
        linkers.SPAN = linkers.DIV = linkers.P = linkers.OTHERWISE = (function(_this) {
          return function(entity, property) {
            element.text(entity[property]());
            return entity.on('modified', function() {
              return element.text(entity[property]());
            });
          };
        })(this);
        _ref = attrs.jefriProperty.split('.'), entity = _ref[0], property = _ref[1];
        entity = scope[entity];
        linker = linkers[element[0].nodeName] || linkers.OTHERWISE;
        return linker(entity, property);
      }
    };
  };

  angular.module('jefri').directive('jefriProperty', ['jQuery', JefriProperty]);

}).call(this);
