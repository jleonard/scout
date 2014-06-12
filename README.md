#Scout
> A scaffolding tool

### How it works
Scout is a command line tool that takes a .json config and scaffolds a web project. Scout will build directories, generate files, clone code from git and pull in dependencies using bower and npm.

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