JefriProperty = ($)->
	restrict: 'A'
	link: !(scope, element, attrs)->
		linkers = {}
		linkers.SELECT = (entity, property)=>
			update = !(val)->
				element.find("option").filter ->
					$this = $(this)
					$this.attr('value') is val or $this.text() is val
				.attr 'selected', true
			element.change ->
				entity[property] element.val()
				try
					scope.$apply()
			entity.on 'modified', !(changed, value)->
				if _(changed).isArray() then [changed, value] = changed
				if changed is property then update value
			# Since Angular probably won't have the <option>s expanded, update at the end of the stack.
			setTimeout (-> update entity[property]()), 0

		linkers.INPUT = (entity, property)=>
			if 'radio' is element.attr 'type'
				update = (val)->
					if val is element.val() then element.attr 'checked', 'checked'
				element.change ->
					entity[property] element.val()
					try
						scope.$apply()
				entity.on 'modified', (changed, value)->
					[changed, value] = changed if angular.isArray(changed)
					if changed is property then update value
				# Since Angular probably won't have the {{value}}s expanded, update at the end of the stack.
				setTimeout (-> update entity[property]()), 0
				return # Seriously, get the hell out of this link function
			linkers.TEXTAREA(entity, property)

		linkers.TEXTAREA = (entity, property)=>
			element.val entity[property]()
			element.change -> entity[property] element.val()
			entity.on 'modified', -> element.val entity[property]()

		linkers.SPAN =
		linkers.DIV =
		linkers.P =
		linkers.OTHERWISE = (entity, property)=>
			element.text entity[property]()
			entity.on 'modified', -> element.text entity[property]()

		[entity, property] = attrs.jefriProperty.split '.'
		entity = scope[entity]
		linker = linkers[element[0].nodeName] || linkers.OTHERWISE
		linker(entity, property)

angular.module 'jefri'
	.directive 'jefriProperty', ['jQuery', JefriProperty]
