'use strict';
var Hapi = require('hapi');
var Path = require('path');
var joi = require('joi');
var multiparty= require('multiparty');
var fs = require('fs');
var port = Number(process.argv[2]) || 3000;
//create a hapi server
var server = new Hapi.Server('0.0.0.0', port, { files: { relativeTo: Path.join(__dirname, 'public') } });
//set the database options for the mongo db.
var dbOpts = {
  "url"       : "mongodb://localhost:27017/AdFame",
  "options"   : {
    "db"    : {
      "native_parser" : false
    }
  }
};
//requires the node modules for the server
server.pack.register(require('./plugin'), function (err) {
  if (err) { console.error('Failes to load a plugin:', err); }
});
//utilize the additional hapi-mongodb module
server.pack.register({
  plugin:require('hapi-mongodb'),
  options: dbOpts 
  
},
function(err){
  if(err){
    console.err(err);
    throw err;
  }
 
});

//create a route for demo 1
server.route({
    method: 'GET',
    path: '/grow2',
    handler: function (request, reply) {
        reply.file('./grow2 demo/grow2.html');
    }
});
//create an additional route for demo 2
server.route({
    method: 'GET',
    path: '/grow',
    handler: function (request, reply) {
        reply.file('./growdemo/containerGrow.html');
    }
});

//route for demo 3
server.route({
    method: 'GET',
    path: '/ball',
    handler: function (request, reply) {
        reply.file('./balldemo/ballbounce.html');
    }
});

//route for the user input page
server.route({
    method: 'GET',
    path: '/user',
    handler: function (request, reply) {
        reply.file('./userinput/inputfield.html');
    }
});


//route for get requests of the database documents
server.route({
  method: 'GET',
  path: '/user/data',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('data').find().toArray(function (err, doc){
      reply(doc);
    });
  }
});
//antipattern

server.route({
  method: 'GET',
  path: '/userimage',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var myRegExp= new RegExp("[^/]+(?=/$|$)");
    var campaign= myRegExp.exec(request.url.path);
    var name = campaign[0].toString();
    db.collection('data').find({"name":name}).toArray(function (err, doc){
      reply(doc);
    });
  }
});

//route for each campaign

server.route({
  method: 'GET',
  path: '/user/{name}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var myRegExp= new RegExp("[^/]+(?=/$|$)");
    var campaign= myRegExp.exec(request.url.path);
    var name = campaign[0].toString();
    db.collection('data').find({"name":name}).toArray(function (err, doc){
      reply(doc);
    });
  }
});

 
// route for post requests to the database with the data objects
server.route({
  method: 'POST',
  path: '/user/data',
  config: {
   
    handler: function (request, reply) {
      // console.log('got here', request.payload)
      // var form = new multiparty.Form();
      // console.log('got here', form)

      // form.parse(request.payload, function(err, fields, files) {
      //   console.log(fields, "Files")
              // fs.readFile(files.upload[0].path,function(err,data){
              //   var newpath = __dirname + "/"+files.upload[0].originalFilename;
              //   fs.writeFile(newpath,data,function(err){
              //       if(err) console.log(err);
              //       else console.log(files)
              //   })
              // })
              //   console.log(files)

            // });

      var Ad = {
        name: request.payload.name,
        data: request.payload.data
      };
      console.log(Ad.data.logo.data)
      // Ad.data.logo.data = fs.readFileSync(Ad.data.logo.data);
      console.log(Ad.data.logo.data)
      var db = request.server.plugins['hapi-mongodb'].db;


      db.collection('data').insert(Ad, {w:1}, function (err, doc){
          if (err){
            return reply(Hapi.error.internal('Internal MongoDB error', err));
          }else{
            reply(doc);
          }
      });
    },
    //validation to require that the objects sent have these properties in order for them to be stored
    validate: {
      payload: {
        name: joi.string().required(),
        data: joi.required(),
        maxBytes:209715200,
        output:'stream',
        parse: false
      }
    }
  }
});
server.start();
console.log('server started on port', port);
