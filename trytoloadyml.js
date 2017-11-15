

/*this works for loading http://thisdavej.com/getting-started-with-yaml-in-node-js-using-js-yaml/
this reads a yaml file and converts it to js*/
const yaml = require('js-yaml');
const fs = require('fs');
try {
    const config = yaml.safeLoad(fs.readFileSync('./db.yml', 'utf8'));
    console.log(config);
} catch (e) {
    console.log(e);
}
/*
const yaml = require('js-yaml');
const fs = require('fs');

//DB for testing
database = { body:
   { comment:
      { id: 1,
        body: 'Updated Body',
        username: 'existing_user',
        articleId: 1 } } };

//this returns the db as a yaml
    const yamlfile = yaml.safeDump (database, {
      'styles': {
        '!!null': 'canonical' // dump null as ~
      },
      'sortKeys': true        // sort object keys
    });
    console.log(database);


    fs.writeFile("./db.yml", yamlfile, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});*/

//https://github.com/nodeca/js-yaml
/*yaml = require('js-yaml');
fs   = require('fs');
database = { body:
   { comment:
      { id: 1,
        body: 'Updated Body'
        username: 'existing_user',
        articleId: 1 } } };

yaml.dump("./db.yml",database);

var doc =yaml.safeLoad(fs.readFileSync('./db.yml', 'utf8'));
console.log(doc);
//write "./db.yml", database, "utf8", (err) -> throw err if err

/*try {
  var doc = yaml.safeLoad(fs.readFileSync('./db.yml', 'utf8'));
  console.log(doc);
} catch (e) {
  console.log(e);
}*/
