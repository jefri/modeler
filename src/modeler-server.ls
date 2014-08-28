Path = require 'path'
server = require 'jefri-server'
express = require 'express'

server.get '/', (req, res)->
	res.sendfile "build/index.html"

path = Path.normalize __dirname + '/../build/'
console.log path
server.use require('st')({url: '/', path})

server.listen 3000
