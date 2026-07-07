import { z } from 'zod'

/**
 * Shared calculator building-block schemas for the v0 output contract.
 *
 * These mirror `packages/common/src/calculator/types.ts` (the canonical
 * source of truth). All numeric values are expressed in data units:
 * airflows in CFM, loads in BTU/h, lengths in inches, temperatures in °F.
 */

// --------------------------------------------------------------------
// -- Flags -----------------------------------------------------------

/**
 * A single entity impacted by a calculator flag. Project-scope flags carry
 * no id; space/zone/system/equipment flags identify the affected entity.
 */
export const FlagEntitySchema_v0 = z
    .union([
        z.object({ entityType: z.literal('project') }),
        z.object({
            entityType: z.enum(['space', 'zone', 'system', 'equipment']),
            id: z.string().describe('ID of the impacted entity.'),
        }),
    ])
    .describe('An entity impacted by a calculator flag.')

/**
 * Calculator flags recording computation problems detected during the run.
 * Keyed by flag type (e.g. `NO_WEATHER_STATION_SELECTED`,
 * `COOLING_LOAD_FAILED`); the value lists the entities impacted by that
 * condition. Absent keys mean the condition did not occur.
 */
export const CalculatorFlagsSchema_v0 = z
    .record(z.string(), z.array(FlagEntitySchema_v0))
    .describe(
        'Calculator flags keyed by flag type; values list impacted entities.'
    )
export type CalculatorFlags_v0 = z.infer<typeof CalculatorFlagsSchema_v0>

// --------------------------------------------------------------------
// -- Psychrometrics --------------------------------------------------

/** Full psychrometric air state at a single point in the airflow. */
export const PsychrometricsSchema_v0 = z
    .object({
        RH: z.number().describe('Relative humidity (fraction 0–1).'),
        T_db: z.number().describe('Dry-bulb temperature (°F).'),
        T_wb: z.number().describe('Wet-bulb temperature (°F).'),
        W: z.number().describe('Humidity ratio (lb water / lb dry air).'),
        W_s: z.number().describe('Saturation humidity ratio at T_db.'),
        W_sTwb: z.number().describe('Saturation humidity ratio at T_wb.'),
        elevation: z.number().describe('Site elevation (inches).'),
        h: z.number().describe('Enthalpy (BTU / lb dry air).'),
        p: z.number().describe('Atmospheric pressure (psi).'),
        p_v: z.number().describe('Partial pressure of water vapor (psi).'),
        p_ws: z.number().describe('Saturation vapor pressure at T_db (psi).'),
        p_wsTwb: z
            .number()
            .describe('Saturation vapor pressure at T_wb (psi).'),
        t_d: z.number().describe('Dew-point temperature (°F).'),
        v: z.number().describe('Specific volume (ft³ / lb dry air).'),
        μ: z.number().describe('Degree of saturation.'),
    })
    .describe('Psychrometric air state.')

/** Result of a heating/cooling process: outlet state plus transfer rate. */
export const ProcessResultSchema_v0 = z
    .object({
        T_db: z.number().describe('Outlet dry-bulb temperature (°F).'),
        T_wb: z.number().describe('Outlet wet-bulb temperature (°F).'),
        m_w: z
            .number()
            .optional()
            .describe('Condensate mass flow rate (lb/h), when applicable.'),
        q: z.number().describe('Heat transfer rate (BTU/h).'),
    })
    .describe('Outlet air state and heat transfer rate of a coil process.')

/** Coil outputs at a single design condition. */
export const CoilOutputsSchema_v0 = z
    .object({
        coilGPM: z
            .number()
            .optional()
            .describe('Coil water flow rate (GPM), when hydronic.'),
        coilLoad: ProcessResultSchema_v0.optional().describe(
            'Total coil load and outlet state.'
        ),
        sensibleCoilLoad: ProcessResultSchema_v0.optional().describe(
            'Sensible coil load and outlet state.'
        ),
    })
    .describe('Coil load outputs at a design condition.')

/** Air states through a piece of equipment at one load condition. */
export const AirStatePsychrometricsSchema_v0 = z
    .object({
        arrivalAir: PsychrometricsSchema_v0.optional(),
        enteringAir: PsychrometricsSchema_v0,
        exhaustAir: PsychrometricsSchema_v0.optional(),
        leavingAir: PsychrometricsSchema_v0,
        outsideAir: PsychrometricsSchema_v0.optional(),
        returnAir: PsychrometricsSchema_v0.optional(),
        temperedAir: PsychrometricsSchema_v0.optional(),
    })
    .describe('Air states across an equipment coil at one load condition.')

// --------------------------------------------------------------------
// -- Airflows --------------------------------------------------------

/** The five airflow streams at a scope or equipment (all CFM). */
export const AirflowsSchema_v0 = z
    .object({
        exhaust: z.number().describe('Exhaust airflow (CFM).'),
        outside: z.number().describe('Outside (ventilation) airflow (CFM).'),
        relief: z.number().describe('Relief airflow (CFM).'),
        return: z.number().describe('Return airflow (CFM).'),
        supply: z.number().describe('Supply airflow (CFM).'),
    })
    .describe('Airflow streams (CFM).')

/** Month/hour coordinate of a peak design condition. */
export const MonthHourSchema_v0 = z
    .object({
        hour: z.number().describe('Hour of day (0–23).'),
        month: z.number().describe('Month (1–12).'),
    })
    .describe('Month/hour of a peak design condition.')

/** Airflows evaluated at each load condition. */
export const LoadConditionAirflowsSchema_v0 = z
    .object({
        cooling: AirflowsSchema_v0.describe('Cooling design condition.'),
        heating: AirflowsSchema_v0.describe('Heating design condition.'),
        max: AirflowsSchema_v0.describe('Worst-case (max) condition.'),
    })
    .describe('Airflows per load condition.')

/** Design airflows: per-condition plus the sum of space peaks. */
export const DesignLoadConditionAirflowsSchema_v0 = z
    .object({
        cooling: AirflowsSchema_v0,
        heating: AirflowsSchema_v0,
        max: AirflowsSchema_v0,
        coolingSpacePeakSum: AirflowsSchema_v0.describe(
            'Cooling airflows summed across member-space peaks.'
        ),
    })
    .describe('Design airflows per load condition.')

/** Code- vs load-required supply airflow sources (CFM). */
export const SupplySourcesSchema_v0 = z
    .object({
        codeRequiredSupply: z
            .number()
            .describe('Supply airflow required by code (CFM).'),
        loadRequiredSupply: z
            .number()
            .describe('Supply airflow required by load (CFM).'),
    })
    .describe('Code- and load-driven supply airflow requirements (CFM).')

/** Required airflows per condition plus their supply-source breakdown. */
export const RequiredLoadConditionAirflowsSchema_v0 = z
    .object({
        cooling: AirflowsSchema_v0,
        heating: AirflowsSchema_v0,
        max: AirflowsSchema_v0,
        supplySources: z
            .object({
                cooling: SupplySourcesSchema_v0.and(
                    z.object({ monthHour: MonthHourSchema_v0 })
                ),
                heating: SupplySourcesSchema_v0,
                max: SupplySourcesSchema_v0,
            })
            .describe('Supply-source breakdown per condition.'),
    })
    .describe('Required airflows per load condition.')

/**
 * ASHRAE 62.1 code-calculated outside airflow (V_OZ) at each design
 * condition (CFM). `max` is the worst case used to size ventilation.
 */
export const CalculatedOutsideAirflowSchema_v0 = z
    .object({
        cooling: z
            .number()
            .describe('Code outside airflow at cooling design (CFM).'),
        heating: z
            .number()
            .describe('Code outside airflow at heating design (CFM).'),
        max: z.number().describe('Worst-case code outside airflow (CFM).'),
    })
    .describe('ASHRAE 62.1 code-calculated outside airflow V_OZ (CFM).')

/**
 * ASHRAE 62.1 breathing-zone outdoor airflow (V_BZ) components.
 * `load.people` is Rp·Pz, `load.area` is Ra·Az, `load.total` is V_BZ.
 */
export const RequiredOutsideAirflowComponentsSchema_v0 = z
    .object({
        code: z
            .object({
                ach: z
                    .number()
                    .describe('Air-change-rate minimum outside airflow (CFM).'),
            })
            .describe('Code (ACH) minimum.'),
        load: z
            .object({
                area: z
                    .number()
                    .describe('Ra·Az — area-driven requirement (CFM).'),
                people: z
                    .number()
                    .describe('Rp·Pz — people-driven requirement (CFM).'),
                total: z
                    .number()
                    .describe('V_BZ — breathing-zone outdoor airflow (CFM).'),
            })
            .describe('Load-driven components.'),
    })
    .describe('ASHRAE 62.1 V_BZ components at the breathing zone.')

/** Central-unit outdoor-air aggregates (central equipment only). */
export const CentralUnitAirflowDataSchema_v0 = z
    .object({
        diversity: z.number().describe('Occupancy diversity ratio D.'),
        outdoorIntakeMultiZone: z
            .number()
            .describe('ASHRAE 62.1 multi-zone corrected OA intake V_OT (CFM).'),
        outdoorIntakeSumOfSpaces: z
            .number()
            .describe('Sum of member-space Voz (CFM).'),
    })
    .describe('Central-unit outdoor-air aggregates.')

// --------------------------------------------------------------------
// -- IAQP ------------------------------------------------------------

/**
 * Sentinel value for an IAQP outdoor airflow that cannot be achieved — no
 * single outdoor-air rate holds every design compound at or below its limit.
 */
export const IAQP_NOT_ACHIEVABLE_v0 = 'not achievable'

/** IAQP outdoor airflow, or the not-achievable sentinel. */
export const IAQPMinimumOutsideAirflowSchema_v0 = z
    .union([z.number(), z.literal(IAQP_NOT_ACHIEVABLE_v0)])
    .describe(
        'IAQP outdoor airflow V_OZ (CFM), or "not achievable" when no single outdoor-air rate satisfies every design compound.'
    )

/** Supplemental per-person CO2 dilution check. */
export const IAQPCO2CalculationsSchema_v0 = z
    .object({
        requiredOutsideAirflow: z
            .number()
            .describe('Supplemental CO2 outdoor-air floor (CFM).'),
        controls: z
            .boolean()
            .describe(
                'True at space scope when the CO2 floor is the selected finite IAQP airflow.'
            ),
    })
    .describe('Supplemental per-person CO2 dilution check.')

/** ASHRAE 62.1 Indoor Air Quality Procedure (IAQP) results. */
export const IAQPCalculationsSchema_v0 = z
    .object({
        airCleanerCount: z
            .number()
            .describe('Number of in-space air cleaners placed in the space.'),
        cleaningAirflow: z
            .number()
            .describe('Total in-space air-cleaner cleaning airflow Vc (CFM).'),
        co2: IAQPCO2CalculationsSchema_v0.optional(),
        controllingCompoundId: z
            .string()
            .optional()
            .describe(
                'Controlling design compound id (worst compound). Space scope only.'
            ),
        minimumOutsideAirflow: IAQPMinimumOutsideAirflowSchema_v0,
        minimumOutsideAirflowByCompound: z
            .record(z.string(), IAQPMinimumOutsideAirflowSchema_v0)
            .optional()
            .describe('Per-compound equality IAQP V_OZ. Space scope only.'),
    })
    .describe('ASHRAE 62.1 Indoor Air Quality Procedure results.')

// --------------------------------------------------------------------
// -- Checksums -------------------------------------------------------

/** Cooling design checksums (per-scope and per-equipment). */
export const CoolingChecksumsSchema_v0 = z
    .object({
        airflowDensity: z
            .number()
            .optional()
            .describe('supplyCFM / area (CFM/ft²).'),
        airflowLoadRatio: z
            .number()
            .optional()
            .describe('supplyCFM / |totalLoad| (CFM per BTU/h).'),
        exhaustAirflowDensity: z
            .number()
            .optional()
            .describe('exhaustCFM / area (CFM/ft²).'),
        loadDensity: z
            .number()
            .optional()
            .describe('|totalLoad| / area (BTU/h/ft²).'),
        loadDistribution: z
            .number()
            .optional()
            .describe('area / |totalLoad| (ft² per BTU/h).'),
        oaAirflowDensity: z
            .number()
            .optional()
            .describe('oaCFM / area (CFM/ft²).'),
        oaAirflowPerPerson: z
            .number()
            .optional()
            .describe('oaCFM / numPeople (CFM/person).'),
        oaFraction: z
            .number()
            .optional()
            .describe('oaCFM / supplyCFM (fraction).'),
        shr: z
            .number()
            .optional()
            .describe('Sensible heat ratio — |sensibleLoad| / |totalLoad|.'),
    })
    .describe('Cooling design checksums.')

/** Heating design checksums (per-scope and per-equipment). */
export const HeatingChecksumsSchema_v0 = z
    .object({
        airflowDensity: z
            .number()
            .optional()
            .describe('supplyCFM / area (CFM/ft²).'),
        exhaustAirflowDensity: z
            .number()
            .optional()
            .describe('exhaustCFM / area (CFM/ft²).'),
        loadDensity: z
            .number()
            .optional()
            .describe('|totalLoad| / area (BTU/h/ft²).'),
    })
    .describe('Heating design checksums.')

/** Scope-level cooling checksums (adds space-peak-sum aggregates). */
export const ScopeCoolingChecksumsSchema_v0 = CoolingChecksumsSchema_v0.extend({
    equipmentDensity: z
        .number()
        .optional()
        .describe('Internal equipment cooling load / area at the peak hour.'),
    lightingDensity: z
        .number()
        .optional()
        .describe('Internal lighting cooling load / area at the peak hour.'),
    spacePeakSumSensibleLoad: z
        .number()
        .optional()
        .describe('Sum of space peaks — absolute sensible load (BTU/h).'),
    spacePeakSumSupplyCFM: z
        .number()
        .optional()
        .describe('Sum of space peaks — supply airflow (CFM).'),
    spacePeakSumTotalLoad: z
        .number()
        .optional()
        .describe('Sum of space peaks — absolute total load (BTU/h).'),
}).describe('Scope-level cooling checksums.')

/** Scope-level checksums (spaces, zones, systems, project). */
export const ScopeChecksumsSchema_v0 = z
    .object({
        cooling: ScopeCoolingChecksumsSchema_v0.optional(),
        heating: HeatingChecksumsSchema_v0.optional(),
    })
    .describe('Scope-level design checksums.')

/** Equipment-level checksums. */
export const EquipmentChecksumsSchema_v0 = z
    .object({
        cooling: CoolingChecksumsSchema_v0.optional(),
        heating: HeatingChecksumsSchema_v0.optional(),
    })
    .describe('Equipment-level design checksums.')

// --------------------------------------------------------------------
// -- Equipment airflows ----------------------------------------------

/** Airflows for a piece of equipment, incl. central-unit aggregates. */
export const EquipmentAirflowsSchema_v0 = z
    .object({
        centralUnit: CentralUnitAirflowDataSchema_v0.optional(),
        configured: z
            .object({
                withLeakage: LoadConditionAirflowsSchema_v0,
                withoutLeakage: LoadConditionAirflowsSchema_v0,
            })
            .describe('Configured airflows with and without duct leakage.'),
        raw: LoadConditionAirflowsSchema_v0.describe(
            'Raw calculated airflows before configuration.'
        ),
    })
    .describe('Equipment airflows including central-unit aggregates.')
