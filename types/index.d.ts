/**
 * @typedef {object} LinkedDataSignature
 */
/**
 * @typedef {object} Presentation
 */
/**
 * @typedef {object} ProofPurpose
 */
/**
 * @typedef {object} VerifiableCredential
 */
/**
 * @typedef {object} VerifiablePresentation
 */
/**
 * @typedef {object} VerifyPresentationResult
 * @property {boolean} verified - True if verified, false if not.
 * @property {object} presentationResult
 * @property {Array} credentialResults
 * @property {object} error
 */
/**
 * @typedef {object} VerifyCredentialResult
 * @property {boolean} verified - True if verified, false if not.
 * @property {object} statusResult
 * @property {Array} results
 * @property {object} error
 */
/**
 * Issues a verifiable credential (by taking a base credential document,
 * and adding a digital signature to it).
 *
 * @param {object} [options={}] - The options to use.
 *
 * @param {object} options.credential - Base credential document.
 * @param {LinkedDataSignature} options.suite - Signature suite (with private
 *   key material or an API to use it), passed in to sign().
 *
 * @param {ProofPurpose} [options.purpose] - A ProofPurpose. If not specified,
 *   a default purpose will be created.
 *
 * Other optional params passed to `sign()`:
 * @param {object} [options.documentLoader] - A document loader.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @throws {Error} If missing required properties.
 *
 * @returns {Promise<VerifiableCredential>} Resolves on completion.
 */
export function issue({ credential, suite, purpose, documentLoader, now }?: {
    credential: object;
    suite: LinkedDataSignature;
    purpose?: ProofPurpose;
    documentLoader?: object;
    now?: string | Date;
}): Promise<VerifiableCredential>;
/**
 * Derives a proof from the given verifiable credential, resulting in a new
 * verifiable credential. This method is usually used to generate selective
 * disclosure and / or unlinkable proofs.
 *
 * @param {object} [options={}] - The options to use.
 *
 * @param {object} options.verifiableCredential - The verifiable credential
 *   containing a base proof to derive another proof from.
 * @param {LinkedDataSignature} options.suite - Derived proof signature suite.
 *
 * Other optional params passed to `derive()`:
 * @param {object} [options.documentLoader] - A document loader.
 *
 * @throws {Error} If missing required properties.
 *
 * @returns {Promise<VerifiableCredential>} Resolves on completion.
 */
export function derive({ verifiableCredential, suite, documentLoader }?: {
    verifiableCredential: object;
    suite: LinkedDataSignature;
    documentLoader?: object;
}): Promise<VerifiableCredential>;
/**
 * Verifies a verifiable presentation:
 *   - Checks that the presentation is well-formed
 *   - Checks the proofs (for example, checks digital signatures against the
 *     provided public keys).
 *
 * @param {object} [options={}] - The options to use.
 *
 * @param {VerifiablePresentation} options.presentation - Verifiable
 *   presentation, signed or unsigned, that may contain within it a
 *   verifiable credential.
 *
 * @param {LinkedDataSignature|LinkedDataSignature[]} options.suite - One or
 *   more signature suites that are supported by the caller's use case. This is
 *   an explicit design decision -- the calling code must specify which
 *   signature types (ed25519, RSA, etc) are allowed.
 *   Although it is expected that the secure resolution/fetching of the public
 *   key material (to verify against) is to be handled by the documentLoader,
 *   the suite param can optionally include the key directly.
 *
 * @param {boolean} [options.unsignedPresentation=false] - By default, this
 *   function assumes that a presentation is signed (and will return an error if
 *   a `proof` section is missing). Set this to `true` if you're using an
 *   unsigned presentation.
 *
 * Either pass in a proof purpose,
 * @param {AuthenticationProofPurpose} [options.presentationPurpose] - Optional
 *   proof purpose (a default one will be created if not passed in).
 *
 * or a default purpose will be created with params:
 * @param {string} [options.challenge] - Required if purpose is not passed in.
 * @param {string} [options.controller] - A controller.
 * @param {string} [options.domain] - A domain.
 *
 * @param {Function} [options.documentLoader] - A document loader.
 * @param {Function} [options.checkStatus] - Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @returns {Promise<VerifyPresentationResult>} The verification result.
 */
export function verify(options?: {
    presentation: VerifiablePresentation;
    suite: LinkedDataSignature | LinkedDataSignature[];
    unsignedPresentation?: boolean;
    presentationPurpose?: any;
    challenge?: string;
    controller?: string;
    domain?: string;
    documentLoader?: Function;
    checkStatus?: Function;
    now?: string | Date;
}): Promise<VerifyPresentationResult>;
/**
 * Verifies a verifiable credential:
 *   - Checks that the credential is well-formed
 *   - Checks the proofs (for example, checks digital signatures against the
 *     provided public keys).
 *
 * @param {object} [options={}] - The options.
 *
 * @param {object} options.credential - Verifiable credential.
 *
 * @param {LinkedDataSignature|LinkedDataSignature[]} options.suite - One or
 *   more signature suites that are supported by the caller's use case. This is
 *   an explicit design decision -- the calling code must specify which
 *   signature types (ed25519, RSA, etc) are allowed.
 *   Although it is expected that the secure resolution/fetching of the public
 *   key material (to verify against) is to be handled by the documentLoader,
 *   the suite param can optionally include the key directly.
 *
 * @param {CredentialIssuancePurpose} [options.purpose] - Optional
 *   proof purpose (a default one will be created if not passed in).
 * @param {Function} [options.documentLoader] - A document loader.
 * @param {Function} [options.checkStatus] - Optional function for checking
 *   credential status if `credentialStatus` is present on the credential.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 *
 * @returns {Promise<VerifyCredentialResult>} The verification result.
 */
export function verifyCredential(options?: {
    credential: object;
    suite: LinkedDataSignature | LinkedDataSignature[];
    purpose?: CredentialIssuancePurpose;
    documentLoader?: Function;
    checkStatus?: Function;
    now?: string | Date;
}): Promise<VerifyCredentialResult>;
/**
 * Creates an unsigned presentation from a given verifiable credential.
 *
 * @param {object} options - Options to use.
 * @param {object|Array<object>} [options.verifiableCredential] - One or more
 *   verifiable credential.
 * @param {string} [options.id] - Optional VP id.
 * @param {string} [options.holder] - Optional presentation holder url.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 * @param {number} [options.version = 2.0] - The VC context version to use.
 *
 * @throws {TypeError} If verifiableCredential param is missing.
 * @throws {Error} If the credential (or the presentation params) are missing
 *   required properties.
 *
 * @returns {Presentation} The credential wrapped inside of a
 *   VerifiablePresentation.
 */
export function createPresentation({ verifiableCredential, id, holder, now, version }?: {
    verifiableCredential?: object | Array<object>;
    id?: string;
    holder?: string;
    now?: string | Date;
    version?: number;
}): Presentation;
/**
 * Signs a given presentation.
 *
 * @param {object} [options={}] - Options to use.
 *
 * Required:
 * @param {Presentation} options.presentation - A presentation.
 * @param {LinkedDataSignature} options.suite - passed in to sign()
 *
 * Either pass in a ProofPurpose, or a default one will be created with params:
 * @param {ProofPurpose} [options.purpose] - A ProofPurpose. If not specified,
 *   a default purpose will be created with the domain and challenge options.
 *
 * @param {string} [options.domain] - A domain.
 * @param {string} options.challenge - A required challenge.
 *
 * @param {Function} [options.documentLoader] - A document loader.
 *
 * @returns {Promise<{VerifiablePresentation}>} A VerifiablePresentation with
 *   a proof.
 */
export function signPresentation(options?: {
    presentation: Presentation;
    suite: LinkedDataSignature;
    purpose?: ProofPurpose;
    domain?: string;
    challenge: string;
    documentLoader?: Function;
}): Promise<{
    VerifiablePresentation: any;
}>;
/**
 * @param {object} presentation - An object that could be a presentation.
 *
 * @throws {Error}
 * @private
 */
export function _checkPresentation(presentation: object): void;
/**
 * @param {object} options - The options.
 * @param {object} options.credential - An object that could be a
 *   VerifiableCredential.
 * @param {string|Date} [options.now] - A string representing date time in
 *   ISO 8601 format or an instance of Date. Defaults to current date time.
 * @param {string} [options.mode] - The mode of operation for this
 *   validation function, either `issue` or `verify`.
 *
 * @throws {Error}
 * @private
 */
export function _checkCredential({ credential, now, mode }?: {
    credential: object;
    now?: string | Date;
    mode?: string;
}): void;
export { dateRegex } from "./helpers.js";
export const defaultDocumentLoader: any;
export { CredentialIssuancePurpose };
export type LinkedDataSignature = object;
export type Presentation = object;
export type ProofPurpose = object;
export type VerifiableCredential = object;
export type VerifiablePresentation = object;
export type VerifyPresentationResult = {
    /**
     * - True if verified, false if not.
     */
    verified: boolean;
    presentationResult: object;
    credentialResults: any[];
    error: object;
};
export type VerifyCredentialResult = {
    /**
     * - True if verified, false if not.
     */
    verified: boolean;
    statusResult: object;
    results: any[];
    error: object;
};
import { CredentialIssuancePurpose } from './CredentialIssuancePurpose.js';
//# sourceMappingURL=index.d.ts.map