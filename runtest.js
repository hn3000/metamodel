
var System = require('systemjs');

System.config({
  trace:true,
  packages: {
    out: {
      format: 'register',
      defaultExtension: 'js'
    }
  },
  paths: {
    'tsunit.external/*': 'node_modules/tsunit.external/*.js'
  },
  __x__defaultJSExtensions: true
});

System.import('out/test/allTests')
  .then(function(x) {
  })
  .then(null, function(x) {
    console.log('failure loading all tests: ', x, x.stack);
  })
;
