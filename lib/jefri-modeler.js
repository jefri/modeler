(function() {
  var Path, express, path, server;

  Path = require('path');

  server = require('jefri-server');

  express = require('express');

  server.get('/', function(req, res) {
    return res.sendfile("build/index.html");
  });

  path = Path.normalize(__dirname + '/../build/');

  console.log(path);

  server.use(require('st')({
    url: '/',
    path: path
  }));

  server.listen(3000);

}).call(this);
