var ldQuery = require( "ld-query" );
var debug = require( "debug" )( "ld-validate" );

function expandRangeValue( range, ldContext ) {
    
    if ( !/\/\//.test( range ) ) {
        
        var pattern = /^(([^:]*):)(.*)$/;
        var qualified = pattern.exec( range );
        if ( qualified ) {

            var alias = ldContext[ qualified[ 2 ] ];
            if ( alias ) { range = range.replace( pattern, alias + "$3" ); }

        } else {
            
            var vocab = ldContext[ "@vocab" ];
            if ( vocab ) { range = vocab + range; }
            
        }
        
    }
    return range;
    
}

function resolveAndCheckForRequired( doc, key, spec ) {
    
    var resolved = doc.query( spec.ldquery );
    if ( !resolved && spec.required ) { 
        
        throw new Error( "Missing: " + spec.ldquery + " for " + key );
        
    }
    return resolved;

}

function validateSimpleValueType( key, value, spec ) {
    
    var type = spec.type;
    if ( !type ) { return; }
    var typeofValue = Array.isArray( value ) ? value.map( x => typeof x ) : typeof value;
    var isTypeArrayMatch = Array.isArray( value ) && ~typeofValue.indexOf( type );
    if ( !isTypeArrayMatch && ( typeofValue !== type ) ) {
        
        throw new Error( "Type of \"" + key + "\" is incorrect. Query was '" + spec.ldquery + "'. Expected: " + type + ". Actual: " + typeofValue );
        
    }
    
}

function validateSimpleValueRange( key, value, spec, ldContext ) {

    var range = spec.range ? expandRangeValue( spec.range, ldContext ) : null;
    if ( range ) {
        
        var isArrayMatch = Array.isArray( value ) && ~value.indexOf( range );
        if ( !isArrayMatch && ( value !== range ) ) {  

            throw new Error( "Value for \"" + key + "\" out of range. Query was '" + spec.ldquery + "'. Expected: " + range + ". Actual: " + value );
            
        }
        
    }
    
}
        
function validateSimpleValue( doc, key, spec, ldContext ) {

    var value = resolveAndCheckForRequired( doc, key, spec );
    if ( value ) {

        if ( typeof value === "object" ) { value = value.json(); } // e.g. @type might return a querynode
        validateSimpleValueType( key, value, spec );
        validateSimpleValueRange( key, value, spec, ldContext );

    }
    debug( key, "is valid:", value );
    
}

function resolveSchema( schemas, schemaName ) {
    
    var schema = typeof schemaName === "string" ? schemas[ schemaName ] : schemaName;
    if ( !( schema && typeof schema === "object" ) ) {
        
        throw new Error( "Invalid schema: " + JSON.stringify( schemaName ) );
        
    }
    return schema;
    
}

function validateObjectValue( doc, key, spec, ldContext, validateData ) {
    
    var resolved = resolveAndCheckForRequired( doc, key, spec );
    if ( resolved ) {

       debug( "___", key, "___" );
        validateData( spec.schema, resolved.json() ); 
        
    }
    debug( "___", key, "___" );

}

function validateDocumentAgainstSchema( ldContext, schema, doc, validateData ) {
    
    for( var key in schema ) {

        var spec = schema[ key ];
        switch( spec.type ) {
            
            case "object":
                
                validateObjectValue( doc, key, spec, ldContext, validateData );
                break;
                
            default:
                validateSimpleValue( doc, key, spec, ldContext );
                
        }

    }
    
}

module.exports = function validationFactory( schemas, ldContext ) {
    
    var query = ldQuery( ldContext );
    
    function validateData( schemaName, data ) {
    
        var schema = resolveSchema( schemas, schemaName );
        var doc = query( data );
        validateDocumentAgainstSchema( ldContext, schema, doc, validateData );
        
    }

    return function validate( schemaName, data, callback ) {
    
        try {
            
            validateData( schemaName, data );
            
        } catch( e ) {
            
            callback( e );
            return;
            
        }
        callback();
        
    };

};
