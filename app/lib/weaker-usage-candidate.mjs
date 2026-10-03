import {PRICES} from './weaker-broker.mjs';
export function conservativeUsageCost(model,stderr){
 const price=PRICES[model];if(!price)throw new Error('UNAPPROVED_MODEL');
 const reported=stderr.match(/\[broker\] model:\s*(\S+)/)?.[1];
 if(reported!==model)throw new Error('BROKER_MODEL_METADATA_MISMATCH');
 const counts=stderr.match(/tokens in\/out\/reasoning:\s*(\d+)\/(\d+)\/(\d+)/);
 if(!counts)throw new Error('BROKER_TOKEN_USAGE_UNKNOWN');
 const [input,output,reasoning]=counts.slice(1).map(Number);
 if(![input,output,reasoning].every(n=>Number.isSafeInteger(n)&&n>=0))throw new Error('BROKER_TOKEN_USAGE_INVALID');
 // Include reasoning again even if it is already inside output, to stay conservative.
 const upperNanoUsd=Math.ceil(input*price.input*1000)+Math.ceil((output+reasoning)*price.output*1000);
 return {inputTokens:input,outputTokens:output,reasoningTokens:reasoning,outputTokensChargedForBound:output+reasoning,pricesUsdPerMillion:price,costUpperBoundUsd:upperNanoUsd/1e9,actualCostUsd:null,method:'Owner list prices times reported tokens; reasoning counted in addition to output; upper bound, not returned costUsd.'};
}
