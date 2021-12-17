/*!
 * Copyright (c) 2019-2021 Digital Bazaar, Inc. All rights reserved.
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
      'AlumniCredential': 'ex:AlumniCredential',
      'Archival': 'ex:Archival',
      'BachelorDegree': 'ex:BachelorDegree',
      'Child': 'ex:Child',
      'CLCredentialDefinition2019': 'ex:CLCredentialDefinition2019',
      'CLSignature2019': 'ex:CLSignature2019',
      'DisputeCredential': 'ex:DisputeCredential',
      'IssuerPolicy': 'ex:IssuerPolicy',
      'HolderPolicy': 'ex:HolderPolicy',
      'Mother': 'ex:Mother',
      'PrescriptionCredential': 'ex:PrescriptionCredential',
      'RelationshipCredential': 'ex:RelationshipCredential',
      'UniversityDegreeCredential': 'ex:UniversityDegreeCredential',
      'ZkpExampleSchema2018': 'ex:ZkpExampleSchema2018',

      'alumniOf': {'@id': 'schema:alumniOf', '@type': 'rdf:HTML'},
      'attributes': 'ex:attributes',
      'child': {'@id': 'ex:child', '@type': '@id'},
      'college': 'ex:college',
      'currentStatus': 'ex:currentStatus',
      'degree': 'ex:degree',
      'degreeSchool': 'ex:degreeSchool',
      'degreeType': 'ex:degreeType',
      'familyName': 'schema:familyName',
      'givenName': 'schema:givenName',
      'issuerData': 'ex:issuerData',
      'name': {'@id': 'schema:name', '@type': 'rdf:HTML'},
      'nonRevocationProof': 'ex:nonRevocationProof',
      'parent': {'@id': 'ex:parent', '@type': '@id'},
      'prescription': 'ex:prescription',
      'primaryProof': 'ex:primaryProof',
      'referenceId': 'ex:referenceId',
      'documentPresence': 'ex:documentPresence',
      'evidenceDocument': 'ex:evidenceDocument',
      'signature': 'ex:signature',
      'signatureCorrectnessProof': 'ex:signatureCorrectnessProof',
      'spouse': 'schema:spouse',
      'statusReason': 'ex:statusReason',
      'subjectPresence': 'ex:subjectPresence',
      'verifier': {'@id': 'ex:verifier', '@type': '@id'},
    }
  ]
};
