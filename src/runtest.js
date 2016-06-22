
var System = require('systemjs');

System.config({
  trace:true,
  map: {
    "fs": "@node/fs"
  },
  packages: {
    out: {
      format: 'register',
      defaultExtension: 'js'
    }
  },
  paths: {
    'tsunit.external/*': 'node_modules/tsunit.external/*.js'
  }
});

System.import('out/test/allTests')
  .then(function(x) {
  })
  .then(null, function(x) {
    console.log('failure loading all tests: ', x, x.stack);
  })
;
