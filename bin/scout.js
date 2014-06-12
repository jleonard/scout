#!/usr/bin/env node
var async = require('async');
var fs            = require('fs');
var findup        = require('findup-sync');
var path          = require('path');
var cwd           = process.cwd();
var shell         = require('child_process').exec;
var mkdirp        = require('mkdirp');
var chalk         = require('chalk');
var userArguments = process.argv.slice(2);
var https = require('follow-redirects').https;
var shellBusy = false;
var json;

var configFile = findup('scoutfile.json', { cwd: cwd });
if (configFile) {
  // load the config and get to work.
  try{
    json = JSON.parse(fs.readFileSync(configFile));
  }catch(e){
    console.log( chalk.white.bgRed.bold(' Error ') , chalk.red(e));
    process.exit(1);
  }
  
  cwd = path.dirname(configFile);
  process.chdir(cwd);

  hooks('pre');
  makeFolders();
  files();
  makeFiles();
  installDependencies();
  hooks('post');

} else {
  // no config file found? we're done here.
  console.log( chalk.white.bgRed.bold(' Error ') , chalk.red("No scoutfile found."));
  process.exit(1);
}

/*
 * Runs the pre and post hooks.
 */
function hooks(hook){
  var arr = json.hasOwnProperty("hooks") && json.hooks.hasOwnProperty(hook) ? json["hooks"][hook] : [];
  var len = arr.length;
  if(len > 0){
    console.log( chalk.white.bgGreen.bold(' Running',hook,'hook... ') );
  }
  for(var ii = 0; ii < len; ii++){
    var cur = arr[ii];
    runShellCommand(cur);
  }
}

function makeFolders(){
  var arr = json.hasOwnProperty('directories') ? json.directories : [];
  var len = arr.length;
  for(var ii = 0; ii < len; ii++){
    var cur = arr[ii];
    var makeDir = typeof(cur) === 'string';
    var _path = makeDir ? cur : firstKeyInObject(cur);

    if(fs.existsSync(_path)){
      console.log(chalk.yellow('The directory',_path, 'already exists.'));
    }else{
      if(makeDir){
        generatePath(_path,function(){});
      }else{
        var repo = json.directories[ii][_path];
        var statement = "git clone "+repo+" "+_path+" && rm -r "+_path+"/.git";
        runShellCommand(statement);
      }
    }
  }
}

function files(){
  var arr = json.hasOwnProperty('files') ? json.files : [];
  async.eachSeries(
    arr,
    function(item,callback){
      console.log('item ',item);
      callback();
    },
    function(err){
      console.log('done!');
    }
  );
}

function makeFiles(){
  var arr = json.hasOwnProperty('files') ? json.files : [];
  var len = arr.length;
  for(var ii = 0; ii < len; ii++){
    var cur = arr[ii];
    var makeEmptyFile = cur.indexOf('github.com') <= -1;
    if(makeEmptyFile){
      // if the file exists let's get out of here.
      if(fs.existsSync(_file)){
        console.log(chalk.yellow('The file',_file, 'already exists.'));
        continue;
      }
      var _file = makeEmptyFile ? cur : firstKeyInObject(cur);
      generateFile(_file,'',function(err){});
    }

    if(!makeEmptyFile){
      var url = cur.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/master/','/master/');
      runShellCommand('curl -O -L --fail --silent --show-error '+url);
    }

  }
}

function installDependencies(){
  var fileDictionary = {'npm':'package.json','bower':'bower.json'};
  var deps = json.hasOwnProperty('dependencies') ? json.dependencies : {};
  var value;
  var options;
  var jsonFile;
  var command;
  
  for (var key in deps){
    if (deps.hasOwnProperty(key)){
      value = deps[key];
      options = value.hasOwnProperty('path') ? {'cwd':value.path} : {};
      jsonFile = value.hasOwnProperty('path') ? value.path+'/'+fileDictionary[key] : jsonFile = fileDictionary[key];
      command = '';

      if(value.hasOwnProperty('packages')){
        command = key+" install --save "+value.packages.join(' ');
      }else if(value instanceof Array){
        command = key+" install --save "+value.join(' ');
      }

      if(!fs.existsSync(jsonFile)){
        console.log('make file ',jsonFile);
        generateFile(jsonFile,'{"name":"my-project"}',function(err){
          runShellCommand(command,options);
        });
      }else{
        runShellCommand(command,options);
      }

    }
  }
}

function firstKeyInObject(obj){
  for(var a in obj){ return a};
}

function generatePath(_path,cb){
  mkdirp(_path, function (err) {
    if (err){
      cb(err);
    }else{
      cb(null);
    }
  });
}

function generateFile(_file,contents,cb){
  contents = contents || '';
  var _path = _file.split('/');
  _path.pop();
  _path = _path.join('/');

  generatePath(_path,function(err){
    if(err){
      console.log( chalk.white.bgRed.bold(' Error ') , chalk.red(err));
      cb(err);
    }else{
      fs.writeFile(_file, contents, function (e) {
        if(err){
          console.log( chalk.white.bgRed.bold(' Error ') , chalk.red(e));
          cb(err);
        }else{
          cb(null);
        }
      });
    }
  });
}

var deferTask;
function runShellCommand(c,options){
  
  if(shellBusy){
    deferTask = {"command":c,"options":options};
  }
  shellBusy = true;

  options = options || {};
  var spawn = shell(c,options,function(error,stdout,stderr){
    if(error){
      console.log( chalk.white.bgRed.bold(' Error ') , chalk.red(error));
      //resetShell();
    }
    if(stdout){
      console.log(chalk.green(stdout));
      //resetShell();
    }
    if(stderr){
      console.log( chalk.white.bgRed.bold(' Error ') , chalk.red(stderr));
      //resetShell();
    }
  });

  spawn.on('close',function(one,two){
    console.log('closed ');
    if(deferTask){
      runShellCommand(deferTask.command,deferTask.options);
    }
    shellBusy = false;
  });
  
}

/*
function resetShell(){
  console.log('resetShell ');
  shellBusy = false;
  if(deferTask){
    console.log('running defer task ',deferTask.command);
    runShellCommand(deferTask.command,deferTask.options);
    deferTask = null;
  }
}
*/