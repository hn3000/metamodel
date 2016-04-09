Meta Model for JavaScript Apps
----

Coming from statically typed languages like Pascal, C and C++, I always wanted to have
more strict typings for my JavaScript classes. While TypeScript allows me to describe
the data using interfaces, I feel it lacks RTTI -- runtime information about the objects
involved that would allow me to construct user interfaces dynamically and validate
incoming data (either from some remote connection or typed in by a user) against the
type information.

This is my attempt at building something to fill this gap.


A metamodel is created like this:

    var sampleObject = {
        lala: 12,
        blah: "Some String",
        blub: 3.1415 * 12
    };

    var modelTypes = require("metamodel").modelTypes;

    var model = modelTypes.addObjectType('sample', ()=>({}))
      .addItem('lala', modelTypes.type('number/int'))
      .addItem('blah', modelTypes.type('string'))
      .addItem('blub', modelTypes.type('number'));

Once the model exists it in the modelTypes registry, it can always be referred
to by name:

    var model = modelTypes.type('sample');
    
And input data can be validated by the model:

    var inputData = {
        lala: "12",
        blah: "Another String",
        blub: 27.12
    };
    
    var context = modelTypes.createParseContext(inputData);
    context.allowConversion = true;
    model.validate(context);
    
At this point, context will contain warnings and errors if the data does
not fit the metamodel. With allowConversion=true, the metamodel will
parse "12" into a number, if allowConversion=false, the string value will
result in an error message.
