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
  console.log('makeFolders ');
  var arr = json.hasOwnProperty('directories') ? json.directories : [];
  console.log(arr);
  var len = arr.length;
  for(var ii = 0; ii < len; ii++){
    var cur = arr[ii];
    if(fs.existsSync(cur)){
      console.log('The directory ',cur, ' already exists.');
    }else{
      mkdirp(cur, function (err) {
        if (err) console.error(err)
        else console.log('pow!')
      });
      /*
      fs.mkdir(cur,function(e){
        if(e){
          console.log('error ',e);
        }else{
          console.log('created directory: ',cur);
        }
      });
    */
    }
  }
}