import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import publicConfig from './sanity.public.json'
import {schemaTypes} from './app/schema'
const dataset = process.env.SANITY_STUDIO_DATASET || publicConfig.dataset
if (!dataset) throw new Error('Set the public dataset name before starting Studio.')
export default defineConfig({
 name:'receipt-desk',title:'Receipt Desk',
 projectId:publicConfig.projectId,dataset,
 plugins:[structureTool()],schema:{types:schemaTypes}
})
