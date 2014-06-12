#Scout
> A scaffolding tool

### How it works
Scout is a command line tool that uses a .json config file to scaffold a project. Scout builds directories, generates files, clones content from git and installs dependencies using bower and npm.

**Config file example**
```js
{
  "hooks": {
    "post":["git clone https://github.com/jleonard/web-box.git vm"]
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
  "dependencies": {
    "npm": {"packages":["gulp","gulp less","gulp watch"],"directory":"build"},
    "bower": ["jquery","brainless"]
  }
}
```

###Installation
> Note: Scout isn't available on npm.

1. ```git clone https://github.com/jleonard/scout.git```
2. ```cd scout && npm link```