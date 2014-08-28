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
