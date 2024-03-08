mkdir ./dist/esm

cat >dist/esm/index.js <<!EOF
import cjsModule from '../index.js';
export const issue = cjsModule.issue;
export const verify = cjsModule.verify;
export const verifyCredential = cjsModule.verifyCredential;
export const createPresentation = cjsModule.createPresentation;
export const signPresentation = cjsModule.signPresentation;
export const derive = cjsModule.derive;
export const defaultDocumentLoader = cjsModule.defaultDocumentLoader;
!EOF

cat >dist/esm/package.json <<!EOF
{
  "type": "module"
}
!EOF
