pretty = ->
	(json)->
		if angular.isString json
			json = JSON.parse json
		JSON.stringify json, null, 4

angular.module 'modeler'
	.filter 'prettyjson', pretty
