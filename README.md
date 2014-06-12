#Scout
> A scaffolding tool

### Overview
Scout is a command line tool that uses a .json config file to scaffold a project. Scout builds directories, generates files, clones content from git and installs dependencies using bower and npm.

**Config file example**
```js
{
  "dependencies": {
    "npm": {"packages":["gulp","gulp less","gulp watch"],"directory":"build"},
    "bower": ["jquery","brainless"]
  },
  "directories":[
    "src/less",
    "src/js",
    "src/img",
    "src/fonts"
  ],
  "files":[
    {"src/README.md":"#README"}
    {"build/gulpfile.js":"//todo"}
  ],
  "hooks": {
    "post":["git clone https://github.com/jleonard/web-box.git vm"]
  }
}
```

###Installation
> Note: Scout isn't available on npm.

1. ```git clone https://github.com/jleonard/scout.git```
2. ```cd scout && npm link```

###Configuration options

####dependencies
Scout will download packages from npm and bower. 

There are two options for specifying dependencies.

**Basic Installation:** In this example bower and npm will install dependencies relative to scout's cwd. Scout will create ``node_modules/``, ``bower_components/``, ``package.json`` and ``bower.json`` in the project root.
```js
"dependencies": {
  "bower": ["jquery","brainless"],
  "npm": ["gulp","gulp less","gulp watch"]
}
```

**Advances Installation:** In this example bower and npm will install dependencies relative to scout's cwd. Scout will create ``node_modules/``, ``bower_components/``, ``package.json`` and ``bower.json`` in the project root.
```js
"dependencies": {
  "bower": ["jquery","brainless"],
  "npm": {"directory":"build","packages":["gulp","gulp less","gulp watch"]}
}
```

####directories


####hooks
Hooks are opportunities to run shell commands before and after the project scaffolding. Available hooks are **pre** and **post** 
```js
"hooks": {
  "pre": ["pwd"],
  "post": ["ls","git clone https://github.com/jleonard/web-box.git vm"]
}
```

