/**
 * Asserts that a context array's first item is a credentials context.
 *
 * @param {object} options - Options.
 * @param {Array} options.context - An array of contexts.
 *
 * @throws {Error} - Throws if the first context
 *   is not a credentials context.
 *
 * @returns {undefined}
 */
export function assertCredentialContext({ context }: {
    context: any[];
}): undefined;
/**
 * Throws if a Date is not in the correct format.
 *
 * @param {object} options - Options.
 * @param {object} options.credential - A VC.
 * @param {string} options.prop - A prop in the object.
 *
 * @throws {Error} Throws if the date is not a proper date string.
 * @returns {undefined}
 */
export function assertDateString({ credential, prop }: {
    credential: object;
    prop: string;
}): undefined;
/**
 * Turns the first context in a VC into a numbered version.
 *
 * @param {object} options - Options.
 * @param {number} options.version - A credentials context version.
 *
 * @returns {number} A number representing the version.
 */
export function getContextForVersion({ version }: {
    version: number;
}): number;
/**
 * Checks if a VC is using a specific context version.
 *
 * @param {object} options - Options.
 * @param {object} options.credential - A VC.
 * @param {number} options.version - A VC Context version
 *
 * @returns {boolean} If the first context matches the version.
 */
export function checkContextVersion({ credential, version }: {
    credential: object;
    version: number;
}): boolean;
export const dateRegex: RegExp;
//# sourceMappingURL=helpers.d.ts.map