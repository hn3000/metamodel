
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
    console.log('then: ', x);
  })
  .then(null, function(x) {
    console.log('else: ', x, x.stack);
  })
;
