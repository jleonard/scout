#!/usr/bin/env node
var fs     = require('fs');
var findup = require('findup-sync');
var path   = require('path');
var cwd    = process.cwd();
var shell  = require('child_process').exec;
var mkdirp = require('mkdirp');
var json;

var userArguments = process.argv.slice(2);

var configFile = findup('scoutfile.json', { cwd: cwd });
if (configFile) {
  json = JSON.parse(fs.readFileSync(configFile));
  hooks('pre');
  makeFolders();
  bower();
  hooks('post');
  cwd = path.dirname(configFile);
  process.chdir(cwd);
} else {
  console.log('No scoutfile found.');
  process.exit(1);
}

function hooks(hook){
  function firstKey(cur){
    for(var a in cur){ return a};
  }
  var arr = json.hasOwnProperty("hooks") && json.hooks.hasOwnProperty(hook) ? json["hooks"][hook] : [];
  var len = arr.length;
  if(len > 0){
    console.log('Running '+hook+' hook...');
  }
  for(var ii = 0; ii < len; ii++){
    var cur = arr[ii];
    var c = typeof(cur) === 'string' ? cur : firstKey(cur);
    var spawn = shell(cur,[]);
    
    spawn.stdout.on('data', function (data) {
      console.log(data);
    });

    spawn.stderr.on('data', function (data) {
      console.log('ERROR: ' + data);
    });
  }
}

function makeFolders(){
  function firstKey(cur){
    for(var a in cur){ return a};
  }
  var arr = json.hasOwnProperty('directories') ? json.directories : [];
  var len = arr.length;
  for(var ii = 0; ii < len; ii++){
    var cur = arr[ii];
    var makeDir = typeof(cur) === 'string';
    var _path = makeDir ? cur : firstKey(cur);

    if(fs.existsSync(_path)){
      console.log('The directory ',_path, ' already exists.');
    }else{
      if(makeDir){
        mkdirp(_path, function (err) {
          if (err) console.error(err)
          else console.log('pow!')
        });
      }else{
        var repo = json.directories[ii][_path];
        var statement = "git clone "+repo+" "+_path+" && rm -r "+_path+"/.git";
        var spawn = shell(statement,[]);
        spawn.stdout.on('data', function (data) {
          console.log(data);
        });

        spawn.stderr.on('data', function (data) {
          console.log('ERROR: ' + data);
        });
      }
    }
  }
}

function bower(){
  var packages = json.hasOwnProperty('bower') && json.bower instanceof Array ? json.bower : json.bower.packages;
  var len = packages.length;
  for(var ii = 0; ii < len; ii++){
    var cur = packages[ii];
    var spawn = shell('bower install '+cur,[]);
    spawn.stdout.on('data', function (data) {
      console.log(data);
    });

    spawn.stderr.on('data', function (data) {
      console.log('ERROR: ' + data);
    });
  }
}