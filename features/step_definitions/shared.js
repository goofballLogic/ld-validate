const should = require( "should" );
const jsonld = require( "jsonld" );
const ldvalidate = require( "../.." );
const schemas = require( "../../schema" );

module.exports = function() {

    this.Given( /^the "([^"]*)" schema$/, function( schemaName ) {

        schemas.should.have.property( schemaName );
        const context = schemas[ "context" ];
        this.validate = ldvalidate( schemas, context );
        this.schemaName = schemaName;

    } );

    this.When( /^I validate the "([^"]*)" document$/, function( sampleName ) {

        const sample = require( `../../sample/${sampleName}.json` );
        const schemaName = this.schemaName;
        return new Promise( ( resolve, reject ) => {

            jsonld.expand( sample, ( e, expanded ) => {

                if ( e ) { reject( e ); } else {

                    this.validate( schemaName, expanded, e => {

                        this.validationError = e;
                        this.validationSucceeded = !e;
                        resolve();

                    } );

                }

            } );

        } );

    } );

    this.Then( /^it should pass$/, function() {

        this.validationSucceeded.should.be.true( this.validationError );

    } );

    this.Then( /^it should fail complaining about "([^"]*)"$/, function( about ) {

        this.validationSucceeded.should.be.false( "Validation did not fail as expected" );
        const bits = about.split( "..." ).map( x => x.trim() );
        bits.forEach( bit => this.validationError.message.should.containEql( bit ) );

    } );


};
