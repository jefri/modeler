angular.module 'modeler', [ 'jefri', 'jquery', 'jsPlumb', 'ui' ]

controller = ($scope, model) ->
	model.on 'ready', ->
		$scope.context = model.context
		try $scope.$digest()

controller.$inject = [ '$scope', 'Model' ]

directive = ($) ->
	restrict: 'E'
	template: $.template \#context
	replace: true
	controller: controller

angular.module 'modeler'
	.directive 'context', ['jQuery', directive]

directive = ($, model) ->
	restrict: 'E'
	template: $.template "\#controls"
	replace: true
	scope: true
	controller: !($scope)->
		$scope =
			action: 'Load'
			storage: 'LocalStore'
			endpoint: 'http://localhost:3000/'
			contexts: []
			contextName: ""
			add: ->
				model.addEntity()
				setTimeout -> $scope.$apply()

			isRemoteStore: -> $scope.storage is 'PostStore'
			isSaving: -> $scope.action is 'Save'
			loadContexts: ->
				model.listContexts($scope.storage, {remote: $scope.endpoint}).then !(results)->
					$scope.contexts = results.entities
					setTimeout -> $scope.$apply()
			finish: ->
				name = if $scope.isSaving() then $scope.contextName || model.context.name() || "DEFAULT_CONTEXT" else $scope.contextId
				model[$scope.action]($scope.storage, name, {remote: $scope.endpoint}).then ->
					setTimeout -> $scope.$apply()
				$scope.showContext = false
			loadSample: -> model.load()
			loadContext: ->
				_.request.post "#{$scope.endpoint}load/", {
					data: '{"context": "http://localhost:3000/entityContext.json"}',
					dataType: "application/json"
				}
				setTimeout -> $scope.$apply()
			export: model.export
			exported: model.export()

angular.module 'modeler'
	.directive 'controls', ['jQuery', 'Model', 'JEFRi', directive]

describe "Directive", ->
	beforeEach module "modeler"

	describe "Controls", (a)->
		it "Has a New Entity button", ->
			inject ($rootScope, $compile)->
				element = "<controls></controls>"
				element = angular.element element
				element = $compile element
				element = element $rootScope

controller = ($scope, Model)->
	newRelationshipId = newPropertyId = 1;
	$scope.addProperty = ->
		$scope.entity.properties Model.runtime.build 'Property',
			name: "property_#{newPropertyId++}"
			type: 'string'
	$scope.addRelationship = ->
		relationship = Model.runtime.build 'Relationship',
			name: "relationship_#{newRelationshipId++}"
			type: 'has_a'
			from_property: $scope.entity._definition().key
		relationship.from $scope.entity
		$scope.entity.relationships relationship

angular.module 'modeler'
	.controller 'Entity', ['$scope', 'Model', controller]

directive = ($, jsp) ->
	restrict: 'E'
	template: $.template '.entity'
	replace: true
	controller: 'Entity'
	link: !(scope, element) ->
		element.draggable
			start: jsp.drag.start
			drag: jsp.drag.drag
			stop: jsp.drag.stop
			stack: ".context .entity"
		.resizable handles: 'e'

angular.module 'modeler'
	.directive 'entity', ['jQuery', 'JSPlumb', directive]

directive = ($, Model) ->
	restrict: 'E'
	template: $.template '.property'
	replace: true

angular.module 'modeler'
	.directive 'property', ['jQuery', 'Model', directive]

directive = ($, jsp, jefri)->
	plumb = !(scope)->
		return unless scope.relationship
		from = ".entity.#{scope.relationship.from().name()}"
		to = ".entity.#{scope.relationship.to().name()}"
		if scope.relationship.from_property() then from = "#from .#{scope.relationship.from_property()}"
		if scope.relationship.to_property() then to = "#to .#{scope.relationship.to_property()}"
		if scope.connector then jsp.detach scope.connector
		label = "#{scope.relationship.from().name()}::#{scope.relationship.name()}"
		scope.connector = jsp.connect $(from), $(to)#, label

	restrict: 'E'
	template: $.template '.relationship'
	replace: true
	link: (scope)->
		# When rendering a relationship, also connect the plumbing.
		setTimeout -> plumb scope
	controller: ($scope)->
		modified = _.lock (field, value)->
			# BUG IN JEFRI (find not implemented quite right)
			_find = (type)->
				found = jefri.find {_type: type, _id: value}
				for ent in found
					if ent.id() is value
						return ent
			[field, value] = field if angular.isArray(field)
			return if value is undefined

			switch field
				when 'to_id'
					to_rel = _find 'Entity'
					$scope.relationship.to to_rel
				when 'from_property'
					from_property = _find 'Property'
					$scope.relationship.from_property from_property.name()
				when 'to_property'
					to_property = _find 'Property'
					$scope.relationship.to_property to_property.name()
				when 'back'
					if value is ""
						$scope.relationship.back ""
					else
						back = _find 'Relationship'
						$scope.relationship.back back.name()
			try $scope.$apply()
			plumb $scope
		$scope.relationship.on 'modified', modified

		$scope.relationship.on 'destroying', ->
			$scope.relationship.off 'modified', modified
			jsp.detach $scope.connector
			$scope.connector = null

		$scope.relationship.on 'destroyed', ->
			$scope.relationship = null

		$scope.entity.on 'destroyed', ->
			$scope.relationship?_destroy()
		$scope.relationship.to().on 'destroyed', ->
			$scope.relationship?._destroy()
			# Do destroy this relationship

angular.module 'modeler'
	.directive 'relationship', ['jQuery', 'JSPlumb', 'JEFRi', directive]
