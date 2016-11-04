Feature: Pass simple validation
  As a developer
  I want to be able to validate simple objects
  So that I can quickly specify schema
  
  Background: the choir schema
    Given the "choir" schema
    
  Scenario: Validate a basic choir
    When I validate the "choir-valid" document
    Then it should pass
    
  Scenario: Validate an invalid choir
    When I validate the "choir-invalid-country-type" document
    Then it should fail complaining about "Type... country"
    
  Scenario: Validate min repetitions
    When I validate the "choir-less-than-1-street-address" document
    Then it should fail complaining about "Minimum... streetAddress"
    
  Scenario: Validate max repetitions
    When I validate the "choir-more-than-3-street-addresses" document
    Then it should fail complaining about "Maximum... streetAddress"
    
  Scenario: Validate min repetitions of objects
    When I validate the "choir-less-than-1-location" document
    Then it should fail complaining about "Minimum... location"
    
  Scenario: Validate max repetitions of objects
    When I validate the "choir-more-than-5-locations" document
    Then it should fail complaining about "Maximum... location"