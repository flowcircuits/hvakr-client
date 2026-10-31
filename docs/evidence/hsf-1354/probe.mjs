
const lib = await import(process.argv[2])
const { ExpandedProjectPostSchema_v0: Post, ExpandedProjectPatchSchema_v0: Patch, GraphSchema_v0, APIProjectCalculationsSchema_v0: Calc, getJSONSchema, MetaGraphNodeDataSchema_v0 } = lib
const ok = (s, v) => s.safeParse(v).success
const unit = { id: 'u', nodeType: 'CENTRAL_UNIT', systemId: 's1', adjacencies: [] }
const cfg = { components: [{ id: 'oa', type: 'OUTSIDE_AIR_INTAKE' }], outlet: { ductHeatGain: 2 }, cost: 1200 }
const out = {}
out['post unplaced CENTRAL_UNIT w/ config'] = ok(Post, { graph: { u: { ...unit, ...cfg } } })
out['post placed CENTRAL_UNIT w/ config'] = ok(Post, { graph: { u: { ...unit, ...cfg, level: 0, point: { x: 1, y: 2 } } } })
out['post unit with level only (should be false)'] = ok(Post, { graph: { u: { ...unit, level: 0 } } })
out['post unplaced FITTING (should be false)'] = ok(Post, { graph: { f: { id: 'f', nodeType: 'FITTING', adjacencies: [] } } })
out['post legacy equipment subcollection'] = ok(Post, { equipment: { e: { projectScope: { type: 'system', id: 's1' } } } })
out['post negative cost (should be false)'] = ok(Post, { graph: { u: { ...unit, cost: -5 } } })
out['post unknown key on unit (should be false)'] = ok(Post, { graph: { u: { ...unit, bogus: 1 } } })
out['patch unplace unit (level/point null)'] = ok(Patch, { graph: { u: { level: null, point: null } } })
out['patch granular outlet + clear cost'] = ok(Patch, { graph: { u: { outlet: { ductHeatGain: null }, cost: null } } })
out['patch legacy equipment key'] = ok(Patch, { equipment: { e: { outlet: { ductHeatGain: 2 } } } })
const eq = { airflows: undefined }
out['calc equipment w/ scope'] = ok(lib.CalcEquipmentSectionSchema_v0, { u: { scope: { type: 'system', id: 's1' } } })
out['calc equipment without scope (should be false)'] = ok(lib.CalcEquipmentSectionSchema_v0, { u: {} })
out['meta graph unplaced unit'] = ok(MetaGraphNodeDataSchema_v0, { nodeType: 'CENTRAL_UNIT', systemId: 's1', pressure: 1 })
try { const j = getJSONSchema(GraphSchema_v0); out['getJSONSchema(Graph) ok'] = !!j } catch (e) { out['getJSONSchema(Graph) ok'] = 'THREW ' + e.message }
try { const j = getJSONSchema(Post); out['getJSONSchema(ExpandedPost) ok'] = !!j } catch (e) { out['getJSONSchema(ExpandedPost) ok'] = 'THREW ' + e.message }
out['exports EquipmentConfigSchema_v0'] = 'EquipmentConfigSchema_v0' in lib
out['exports EquipmentDataSchema_v0'] = 'EquipmentDataSchema_v0' in lib
out['PROJECT_SUBCOLLECTION_KEYS_V0 has equipment'] = lib.PROJECT_SUBCOLLECTION_KEYS_V0?.includes('equipment')
for (const [k, v] of Object.entries(out)) console.log(String(v).padEnd(6), k)

