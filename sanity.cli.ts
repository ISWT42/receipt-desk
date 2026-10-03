import {defineCliConfig} from 'sanity/cli'
import publicConfig from './sanity.public.json'
export default defineCliConfig({
 api:{projectId:publicConfig.projectId,dataset:process.env.SANITY_STUDIO_DATASET || publicConfig.dataset || undefined},
 vite:{publicDir:false}
})
