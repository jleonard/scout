#!/usr/bin/env node
var fs     = require('fs');
var findup = require('findup-sync');
var path   = require('path');
var cwd    = process.cwd();
var shell  = require('child_process').exec;
var json;

var userArguments = process.argv.slice(2);

var configFile = findup('scoutfile.json', { cwd: cwd });
if (configFile) {
  //console.log('Found scoutfile:', configFile);
  json = JSON.parse(fs.readFileSync(configFile));
  pre();
  makeFolders();
  cwd = path.dirname(configFile);
  process.chdir(cwd);
  //console.log('Setting current working directory:', cwd);
} else {
  console.log('No scoutfile found.');
  process.exit(1);
}

function pre(){
  function firstKey(cur){
    for(var a in cur){ return a};
  }
  var arr = json.hasOwnProperty('hooks') && json.hooks.hasOwnProperty('pre') ? json.hooks.pre : [];
  console.log(arr);
  var len = arr.length;
  for(var ii = 0; ii < len; ii++){
    var cur = arr[ii];

    var c = typeof(cur) === 'string' ? cur : firstKey(cur);

    console.log('command = ',c,typeof(c));

    var spawn = shell(cur,[]);
    spawn.stdout.on('data', function (data) {
      console.log('data ',data);
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
    console.log('ding ',cur);
    if(fs.existsSync(cur)){
      console.log('The directory ',cur, ' already exists.');
    }else{
      fs.mkdir(cur,function(e){
        if(e){
          console.log('error ',e);
        }else{
          console.log('created directory: ',e);
        }
      });
    }
    
  }
}