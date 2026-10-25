/** Provisional 05-A candidate-site balance values.
 * Noncanonical, deliberately separated from the resource identity and save contracts.
 * Changes to these values require long-horizon and save compatibility review.
 */
const DAY=86400;
export const CANDIDATE_REGEN_05A=Object.freeze({
 'source05a:blueberry':Object.freeze({seconds:DAY,units:2,seasons:Object.freeze([1,2,1,0])}),
 'source05a:reed':Object.freeze({seconds:DAY,units:2,seasons:Object.freeze([1,2,1,0])}),
 'source05a:mussel':Object.freeze({seconds:2*DAY,units:2,seasons:Object.freeze([1,1,1,1])}),
 'source05a:marsh-bell':Object.freeze({seconds:3*DAY,units:1,seasons:Object.freeze([1,1,2,0.5])})
});
