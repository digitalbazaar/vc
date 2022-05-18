/* eslint-disable quotes, quote-props, max-len */
/**
 * Private key store for the test DID Document.
 * Note that this is for unit testing purposes only, please do not commit
 * _actual_ private keys into a GitHub repo.
 */
const keys = {
  "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m": {
    "controller": "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m",
    "id": "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m",
    "privateKeyBase58": "ZxCUJSxY8xKPwGoXDm2VHGQfvHdzwYySgXFuMgvhfFKBRs1pG39uwWgaymnwG7rFDDg23dXmyKKxGUa3bNeG8wo",
    "publicKeyBase58": "9RSUMjw9BL4edKrS8ugTfaartEdjhk4kDoZPDEPHvQKP",
    "type": "Ed25519VerificationKey2018"
  },
  // Authentication key
  "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MkrpF1a896RdiCPsxt65HVgZeijUxyetCJgF9QXGrY8Zz2": {
    "controller": "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m",
    "id": "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MkrpF1a896RdiCPsxt65HVgZeijUxyetCJgF9QXGrY8Zz2",
    "privateKeyBase58": "XqGFjtR8CYPCPafnYQevxEsemNAULMziMsyh5czRVHeAyGfjBGFeXo4qitgAefZjYphaSNaSvLKvZSRLvKWs44S",
    "publicKeyBase58": "DMyxystf66DjHP8BQWKeqU6iuuh8EzwwzEEUgztXDMCe",
    "type": "Ed25519VerificationKey2018"
  },
  "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MksL9CNsMS5W9pSv1jYeGkTkdjzDKdnmP293AW38BK4Qet": {
    "controller": "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m",
    "id": "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MksL9CNsMS5W9pSv1jYeGkTkdjzDKdnmP293AW38BK4Qet",
    "privateKeyBase58": "2ppB3i3ndQ2ZKU48pRvF1xNG9kwnGccYTaZXGuWaDifkpjT6uXQRPUVNovKKcYwjf4fig6secVbmyQL6nVdrLsQc",
    "publicKeyBase58": "Dst9nd6zjxfMLRB2s5Jucf5kAe3nNt8fT2FaCrDJ9BsW",
    "type": "Ed25519VerificationKey2018"
  },
  // Assertion key
  "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MkvAihyZkTsYGqKEHjutEMmYp7MeW9KRKGX1jyatu3p3eM": {
    "controller": "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m",
    "id": "did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MkvAihyZkTsYGqKEHjutEMmYp7MeW9KRKGX1jyatu3p3eM",
    "privateKeyBase58": "3qdH4Aostama54p2GvtksjGo2oJd5oQYgc2ZmKK6wXCwUz9jmsuHN1ti41zV5REZ6FChgA9q1b9QbXs2MggDvxvH",
    "publicKeyBase58": "GiTfPKW2XznNCjT3EKGWvTG7Y5EHuY4upzq3kcw2tpry",
    "type": "Ed25519VerificationKey2018"
  }
};

export const mockDidKeys = {
  keys,
  AUTHENTICATION_KEY_ID: 'did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MkrpF1a896RdiCPsxt65HVgZeijUxyetCJgF9QXGrY8Zz2',
  ASSERTION_KEY_ID: 'did:v1:test:nym:z6MknshWwzBaWsZ7jph8pUeJWg8rhoub7dK6upUK3WMJqd6m#z6MkvAihyZkTsYGqKEHjutEMmYp7MeW9KRKGX1jyatu3p3eM'
};
