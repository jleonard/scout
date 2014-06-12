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

  async.series({
    pre: function(callback){
      hooks('pre',function(err){ callback(null,null) });
    },
    directories: function(callback){
      directories(function(err){ callback(null,null) });
    },
    files: function(callback){
      files(function(err){ callback(null,null) });
    },
    files: function(callback){
      dependencies(function(err){ callback(null,null) });
    },
    post: function(callback){
      hooks('post',function(err){ callback(null,null) });
    },
  });

} else {
  // no config file found? we're done here.
  console.log( chalk.white.bgRed.bold(' Error ') , chalk.red("No scoutfile found."));
  process.exit(1);
}

function hooks(hook,complete){
  var arr = json.hasOwnProperty("hooks") && json.hooks.hasOwnProperty(hook) ? json["hooks"][hook] : [];
  async.eachSeries(
    arr,
    function(item,callback){
      runShellCommand(item,{},function(code,signal){
        var err = code === 0 ? code : null;
        callback(err);
      });
    },
    function(err){
      complete(err);
    }
  );
}

function dependencies(complete){
  var arr = json.hasOwnProperty('dependencies') ? json.dependencies : [];
  var fileDictionary = {'npm':'package.json','bower':'bower.json'};
  async.eachSeries(
    Object.keys(arr),
    function(key,callback){
      var item = arr[key];
      var options = {};
      var directory = item.directory;
      var args = item.hasOwnProperty(args) ? item.args : '';
      var packages = item instanceof Array ? item : item.packages;
      var command;
      if(typeof(packages) === 'undefined'){
        console.log(chalk.yellow('No',key,'packages defined'));
        callback();
      }else{
        command = key + ' install --save ' + args + packages.join(' ');
      }

      if(directory){
        options.cwd = directory;
      }else{
        directory = '';
      }

      var _path = path.join(directory,fileDictionary[key]);

      if(fs.existsSync(_path)){
        console.log(chalk.yellow('The file',_path, 'already exists.'));
        runShellCommand(command,options,function(code,signal){
          var err = code === 0 ? code : null;
          callback(err);
        });
      }else{
        generateFile(_path,'{"name":"my-project"}',function(err){
          runShellCommand(command,options,function(code,signal){
            var err = code === 0 ? code : null;
            callback(err); 
          });
        });
      }

    },
    function(err){
      complete(err);
    }
  );
}

function directories(complete){
  var arr = json.hasOwnProperty('directories') ? json.directories : [];
  async.eachSeries(
    arr,
    function(item,callback){
      var makeDir = typeof(item) === 'string';

      // folder exists. move on.
      if(fs.existsSync(item)){
        console.log(chalk.yellow('The directory',item, 'already exists.'));
        callback();
      }

      if(makeDir){
        generatePath(item,function(err){ callback(err); });
      }else{
        var key = firstKeyInObject(item);
        var value = item[key];
        if(fs.existsSync(key)){
          console.log(chalk.yellow('The directory',key, 'already exists.'));
          callback();
        }else{
          generatePath(key,function(err){
            if(!err){
              var statement = "git clone "+value+" "+key+" && rm -r "+key+"/.git";
              runShellCommand(statement,{"cwd":key},function(code,signal){
                var err = code === 0 ? code : null;
                if(!err){
                  console.log(chalk.green('Cloned',value,'into',key));
                }else{
                  console.log( chalk.white.bgRed.bold(' Error cloning ') , chalk.red(value));
                }
                callback(err);
              });
            }
          });
        }
      }
    },
    function(err){
      complete(err);
    }
  );
}

function files(complete){
  var arr = json.hasOwnProperty('files') ? json.files : [];
  async.eachSeries(
    arr,
    function(item,callback){
      
      // simple string. create an empty file if one doesn't already exist.
      if(typeof(item) === 'string'){
        if(fs.existsSync(item)){
          console.log(chalk.yellow('The file',item, 'already exists.'));
          callback();
        }else{
          generateFile(item,'',function(err){
            callback(err);
          });
        }
      }

      // object. are we curling a github file or are we writing content to a file?
      if(typeof(item) === 'object'){
        var key = firstKeyInObject(item);
        var value = item[key];

        if(value.indexOf('github.com') <= -1){ // writing content to a file.
          generateFile(key,value,function(err){
            callback(err);
          });
        }else{ // curling from github
          var url = value.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/master/','/master/');
          generatePath(key,function(err){
            if(!err){
              runShellCommand('curl -O -L --fail --silent --show-error '+url,{'cwd':key},function(code,signal){
                var err = code === 0 ? code : null;
                if(!err){
                  console.log(chalk.green('Cloned',value,'into',key));
                }else{
                  console.log( chalk.white.bgRed.bold(' Error cloning ') , chalk.red(value));
                }
                callback(err);
              });
            }else{
              callback(err);
            }
          });
        }
      }
    },
    function(err){
      complete(err);
    }
  );
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
          console.log(chalk.green('Created ',_file));
          cb(null);
        }
      });
    }
  });
}


function runShellCommand(c,options,cb){
  options = options || {};
  var spawn = shell(c,options,function(error,stdout,stderr){
    if(error){
      console.log( chalk.white.bgRed.bold(' Error ') , chalk.red(error));
    }
    if(stdout){
      console.log(chalk.green(stdout));
    }
    if(stderr){
      console.log( chalk.white.bgRed.bold(' Error ') , chalk.red(stderr));
    }
  });

  spawn.on('close',function(code,signal){
    cb(code,signal);
  });
  
}

