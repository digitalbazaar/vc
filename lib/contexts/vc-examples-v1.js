/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */

/* eslint-disable quote-props */
module.exports = {
  '@context': [
    {
      '@version': 1.1
    },
    'https://www.w3.org/ns/odrl.jsonld',
    {
      'ex': 'https://example.org/examples#',
      'schema': 'http://schema.org/',
      'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',

      '3rdPartyCorrelation': 'ex:3rdPartyCorrelation',
      'AllVerifiers': 'ex:AllVerifiers',
      'Archival': 'ex:Archival',
      'BachelorDegree': 'ex:BachelorDegree',
      'Child': 'ex:Child',
      'CLCredentialDefinition2019': 'ex:CLCredentialDefinition2019',
      'CLSignature2019': 'ex:CLSignature2019',
      'IssuerPolicy': 'ex:IssuerPolicy',
      'HolderPolicy': 'ex:HolderPolicy',
      'Mother': 'ex:Mother',
      'RelationshipCredential': 'ex:RelationshipCredential',
      'UniversityDegreeCredential': 'ex:UniversityDegreeCredential',
      'ZkpExampleSchema2018': 'ex:ZkpExampleSchema2018',

      'alumniOf': {'@id': 'schema:alumniOf', '@type': 'rdf:HTML'},
      'child': {'@id': 'ex:child', '@type': '@id'},
      'degree': 'ex:degree',
      'name': {'@id': 'schema:name', '@type': 'rdf:HTML'},
      'parent': {'@id': 'ex:parent', '@type': '@id'},
      'referenceId': 'ex:referenceId',
      'documentPresence': 'ex:documentPresence',
      'evidenceDocument': 'ex:evidenceDocument',
      'subjectPresence': 'ex:subjectPresence',
      'verifier': {'@id': 'ex:verifier', '@type': '@id'},
    }
  ]
};
