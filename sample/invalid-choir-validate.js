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
