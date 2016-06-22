var fs = require('fs');
var x = require('../out/json-ptr.js');
var ee = new x.JsonReferenceProcessor(x => {
  console.log("reading ",x);
  return Promise.resolve(fs.readFileSync(x,'utf-8'))
});

function logger(m, p) {
  return (x) => {
    console.log(m, p);
    try {
      console.log(JSON.stringify(x,null,2));
    }
    catch (up) {
      console.log("ooops:", up);
    }
  }
}

var ref;

ref = './test/json-ptr.refs.json';
console.log("expanding ", ref);
ee.expandRef(ref).then(logger("two: ", ref), console.log.bind(console, "error(2)"));


ref = './test/json-ptr.test.json';
console.log("expanding ", ref);
ee.expandRef(ref).then(logger("one: ", ref), console.log.bind(console, "error(1)"));


console.log("done.");