# ld-validate
A tiny library to validate json-ld documents using ld-query

## Examples

### Passing

```
    const jsonld = require( "jsonld" );
    const sample = require( "./valid-choir.json" );
    jsonld.expand( sample, ( e, expanded ) => { 
        
        const ldvalidate = require( ".." );
        const schemas = require( "../schema" );
        const context = schemas[ "context" ];
        const validate = ldvalidate( schemas, context );
        validate( "choir", expanded, e => {
            
            if ( e ) { console.error( e ); } else {
                
                console.log( "Validated ok" );
                
            }
            
        } );
        
    } );
```

$ node ./sample/valid-choir-validate.js 
Validated ok

### Failing

```

    const jsonld = require( "jsonld" );
    const sample = require( "./invalid-choir.json" );
    jsonld.expand( sample, ( e, expanded ) => { 
        
        const ldvalidate = require( ".." );
        const schemas = require( "../schema" );
        const context = schemas[ "context" ];
        const validate = ldvalidate( schemas, context );
        validate( "choir", expanded, e => {
            
            if ( e ) { console.error( e ); } else {
                
                console.log( "Validated ok" );
                
            }
            
        } );
        
    } );

```

$ node ./sample/invalid-choir-validate.js                                                                 
[Error: Type of "country" is incorrect. Query was '> addressCountry @value'. Expected: string. Actual: number]

