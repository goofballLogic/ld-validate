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

function constrainByRequired( key, resolved, spec ) {
    
    if ( spec.required && resolved.length < 1 ) {

        throw new Error( "Missing: " + spec.ldquery + " for " + key );

    }

}

function constrainByType( key, value, spec ) {

    var type = spec.type;
    if ( !type ) { return; }
    var typeofValue = Array.isArray( value ) ? value.map( x => typeof x ) : typeof value;
    var isTypeArrayMatch = Array.isArray( value ) && ~typeofValue.indexOf( type );
    if ( !isTypeArrayMatch && ( typeofValue !== type ) ) {

        throw new Error( "Type of \"" + key + "\" is incorrect. Query was '" + spec.ldquery + "'. Expected: " + type + ". Actual: " + typeofValue );

    }

}

function constrainByRange( key, value, spec, ldContext ) {

    var range = spec.range ? expandRangeValue( spec.range, ldContext ) : null;
    if ( range ) {

        var isArrayMatch = Array.isArray( value ) && ~value.indexOf( range );
        if ( !isArrayMatch && ( value !== range ) ) {

            throw new Error( "Value for \"" + key + "\" out of range. Query was '" + spec.ldquery + "'. Expected: " + range + ". Actual: " + value );

        }

    }

}

function constrainByMin( key, values, spec ) {

    if ( !( "min" in spec ) ) { return; }
    var min = Math.max( parseInt( spec.min ) || 0, 0 );
    if ( values.length < min ) {

        throw new Error( "Minimum count of \"" + key + " is " + min + ", but found: " + values.length );

    }

}

function constrainByMax( key, values, spec ) {
    
    if ( !( "max" in spec ) ) { return; }
    var max = Math.max( parseInt( spec.max ) || 0, 0 );
    if ( values.length > max ) {

        throw new Error( "Maximum count of \"" + key + " is " + max + ", but found: " + values.length );

    }
    
}

function validateValues( doc, key, spec ) {

    var values = doc.queryAll( spec.ldquery );
    constrainByRequired( key, values, spec );
    constrainByMin( key, values, spec );
    constrainByMax( key, values, spec );
    return values;

}

function validateSimpleValues( doc, key, spec, ldContext ) {

    validateValues( doc, key, spec ).forEach( ( value, i, values ) => {

        if ( typeof value === "object" ) { value = value.json(); } // e.g. @type might return a querynode
        constrainByType( key, value, spec );
        constrainByRange( key, value, spec, ldContext );
        debug( "val", key, i, "of", values.length, "is valid:", value );

    } );

}


function validateObjectValues( doc, key, spec, ldContext, validateData ) {

    validateValues( doc, key, spec ).forEach( ( object, i ) => {
        
        debug( key, "/-", key, i, "-\\" );
        validateData( spec.schema, object.json() );
        debug( key, "\\-", key, i, "-/" );

    } );

}

function validateDocumentAgainstSchema( ldContext, schema, doc, validateData ) {

    for ( var key in schema ) {

        var spec = schema[ key ];
        switch ( spec.type ) {

            case "object":

                validateObjectValues( doc, key, spec, ldContext, validateData );
                break;

            default:
                validateSimpleValues( doc, key, spec, ldContext );

        }

    }

}


function resolveSchema( schemas, schemaName ) {

    var schema = typeof schemaName === "string" ? schemas[ schemaName ] : schemaName;
    if ( !( schema && typeof schema === "object" ) ) {

        throw new Error( "Invalid schema: " + JSON.stringify( schemaName ) );

    }
    return schema;

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

            debug( schemaName, "--", schemaName, "--" );
            validateData( schemaName, data );
            debug( schemaName, "--", schemaName, "--" );

        } catch ( e ) {

            callback( e );
            return;

        }
        callback();

    };

};
