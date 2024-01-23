/* eslint-disable */
const credential2018 = {
  "issuer": {
    "type": [
      "profile"
    ],
    "id": "did:key:z6Mkn957Vwed2zBLLZkYiDgoha3cm1KtSE3PeAryJf3T7Vwz",
    "name": "K-Pop"
  },
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential"
  ],
  "credentialSubject": {
    "type": [
      "AchievementSubject"
    ],
    "id": "mailto:jdoe@example.com",
    "name": "John Doe",
    "achievement": {
      "type": [
        "Achievement"
      ],
      "name": "Energizer Award",
      "description": "Awarded to John Doe."
    }
  },
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    "https://purl.imsglobal.org/spec/ob/v3p0/extensions.json"
  ],
  "issuanceDate": "2024-01-23T16:36:00.714Z",
  "proof": {
    "type": "Ed25519Signature2018",
    "created": "2024-01-23T16:36:01Z",
    "verificationMethod": "did:key:z6Mkn957Vwed2zBLLZkYiDgoha3cm1KtSE3PeAryJf3T7Vwz#z6Mkn957Vwed2zBLLZkYiDgoha3cm1KtSE3PeAryJf3T7Vwz",
    "proofPurpose": "assertionMethod",
    "jws": "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..VgsJqZGkkT-Mbn20-g7nY4UsTCjmGc96J47rJJ3BTq60sU-3C3L8BIoI75nsfvlbKGz3TehSztnF1fkxlgCSCg"
  }
};

module.exports = credential2018;
