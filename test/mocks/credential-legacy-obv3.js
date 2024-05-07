/* eslint-disable max-len */

export default {
  '@context': ['https://www.w3.org/2018/credentials/v1', 'https://purl.imsglobal.org/spec/ob/v3p0/context.json', 'https://w3id.org/security/suites/ed25519-2020/v1'],
  id: 'urn:uuid:e7af51df-d51f-4ac3-bb57-c229c0e61679',
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  name: 'Digital Credentials Consortium Demo',
  issuer: {
    type: ['Profile'],
    id: 'did:key:z6MkhVTX9BF3NGYX6cc7jWpbNnR7cAjH8LUffabZP8Qu4ysC',
    name: 'Digital Credentials Consortium',
    url: 'https://dcconsortium.org/',
    image: 'https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png'
  },
  issuanceDate: '2023-04-13T21:00:48.141Z',
  credentialSubject: {
    type: ['AchievementSubject'],
    achievement: {
      id: 'urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922',
      type: ['Achievement'],
      achievementType: 'Badge',
      name: 'Digital Credentials Consortium Demo',
      description: 'Digital Credentials Consortium demo credential.',
      criteria: {
        type: 'Criteria',
        narrative: 'The recipient successfully installed Learner Credential Wallet (https://lcw.app/) and added a credential.'
      },
      image: {
        id: 'https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png',
        type: 'Image'
      }
    }
  },
  proof: {
    type: 'Ed25519Signature2020',
    created: '2023-04-13T21:00:48Z',
    verificationMethod: 'did:key:z6MkhVTX9BF3NGYX6cc7jWpbNnR7cAjH8LUffabZP8Qu4ysC#z6MkhVTX9BF3NGYX6cc7jWpbNnR7cAjH8LUffabZP8Qu4ysC',
    proofPurpose: 'assertionMethod',
    proofValue: 'z5pBsZaMcEv76AvDtsWpNrCB2ZXp3ZVXSxdQovH8AVV5E8k8jUTpnZ8fFSDHHEdewq544Cdi2shH8gJdj6xidcxCz'
  }
};
