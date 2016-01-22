Meta Model for JavaScript Apps
----

Coming from statically typed languages like Pascal, C and C++, I always wanted to have
more strict typings for my JavaScript classes. While TypeScript allows me to describe
the data using interfaces, I feel it lacks RTTI -- runtime information about the objects
involved that would allow me to construct user interfaces dynamically and validate
incoming data (either from some remote connection or typed in by a user) against the
type information.

This is my attempt at building something to fill this gap.

