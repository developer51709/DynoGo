/**
 * DynoGo Physics Engine
 *
 * All calculations are based on real internal combustion engine thermodynamics.
 * References:
 *  - Heywood, J.B. "Internal Combustion Engine Fundamentals" (1988)
 *  - Taylor, C.F. "The Internal Combustion Engine in Theory and Practice" (1985)
 *  - Pulkrabek, W.W. "Engineering Fundamentals of the Internal Combustion Engine" (2004)
 */

export type FuelType = "gasoline" | "e85" | "race_gas" | "diesel" | "e30";

export interface FuelProperties {
  label: string;
  lhv: number;       // Lower Heating Value in BTU/lb
  stoich_afr: number; // Stoichiometric Air-Fuel Ratio
  ron: number;       // Research Octane Number (affects knock limit, compression)
  density: number;   // lb/gallon
}

// Fuel properties from literature
export const FUEL_PROPERTIES: Record<FuelType, FuelProperties> = {
  gasoline: {
    label: "Gasoline (91/93 Pump)",
    lhv: 18_900,
    stoich_afr: 14.7,
    ron: 93,
    density: 6.17,
  },
  e30: {
    label: "E30 (30% Ethanol)",
    lhv: 17_100,
    stoich_afr: 13.4,
    ron: 100,
    density: 6.33,
  },
  e85: {
    label: "E85 (85% Ethanol)",
    lhv: 12_600,
    stoich_afr: 9.8,
    ron: 105,
    density: 6.59,
  },
  race_gas: {
    label: "Race Gas (C16)",
    lhv: 18_500,
    stoich_afr: 15.1,
    ron: 116,
    density: 6.34,
  },
  diesel: {
    label: "Diesel",
    lhv: 18_500,
    stoich_afr: 14.5,
    ron: 25, // CN ~50 — not knock-limited
    density: 7.09,
  },
};

export interface EngineParams {
  // Geometry
  displacement_ci: number;   // Cubic inches
  cylinders: number;
  compression_ratio: number;
  bore_in: number;           // Inches
  stroke_in: number;         // Inches

  // Cam / Induction
  cam_duration: number;      // Degrees (at 0.050" lift) — 180 to 320
  lsa: number;               // Lobe Separation Angle (degrees) — 108 to 118
  ve_preset: number;         // 0-1 multiplier (user override of base VE)

  // Fuel & Mixture
  fuel_type: FuelType;
  afr: number;               // Air-Fuel Ratio (lambda = afr / stoich_afr)
  boost_psi: number;         // Boost pressure (0 = N/A)
  intercooler_efficiency: number; // 0.0 to 1.0

  // Operating range
  idle_rpm: number;
  redline_rpm: number;
}

export interface DynoPoint {
  rpm: number;
  torque_lbft: number;
  hp: number;
  ve: number;
  cfm: number;
  maf_lbmin: number;
  fuel_flow_lbmin: number;
  thermal_efficiency: number;
  fhp: number;
  ihp: number;
  bsfc: number;
}

export interface DynoResult {
  points: DynoPoint[];
  peak_hp: number;
  peak_hp_rpm: number;
  peak_torque: number;
  peak_torque_rpm: number;
  peak_cfm: number;
}

// Standard atmospheric conditions (ISA sea level)
const RHO_AIR_STD = 0.0765; // lb/ft³ at 59°F, 14.696 psia
const ATM_PSI = 14.696;      // psia
const GAMMA = 1.355;          // Ratio of specific heats for fuel-air mixture (slightly below 1.4 for air)
const HP_PER_BTU_MIN = 1 / 42.44; // 1 HP = 42.44 BTU/min

// Charge-air model
const AMBIENT_TEMP_K = 288.15;      // 59 °F — matches RHO_AIR_STD
const GAMMA_AIR = 1.4;              // ratio of specific heats for air
const COMPRESSOR_EFFICIENCY = 0.72; // typical turbo/supercharger isentropic efficiency

/**
 * Manifold charge temperature after compression and intercooling, in Kelvin.
 *
 * Compressor outlet follows the isentropic relation
 *   T_out = T_amb · (1 + (PR^((γ−1)/γ) − 1) / η_c)
 * and the intercooler then removes a fraction of the temperature rise equal to
 * its effectiveness:
 *   T_man = T_out − η_ic · (T_out − T_amb)
 *
 * With η_ic = 0 the charge stays at compressor-outlet temperature; with η_ic = 1
 * it returns fully to ambient.
 */
export function manifoldTempK(boost_psi: number, intercooler_efficiency: number): number {
  if (boost_psi <= 0) return AMBIENT_TEMP_K;

  const pressure_ratio = 1 + boost_psi / ATM_PSI;
  const outlet_k =
    AMBIENT_TEMP_K *
    (1 +
      (Math.pow(pressure_ratio, (GAMMA_AIR - 1) / GAMMA_AIR) - 1) /
        COMPRESSOR_EFFICIENCY);

  const ic = Math.min(1, Math.max(0, intercooler_efficiency));
  return outlet_k - ic * (outlet_k - AMBIENT_TEMP_K);
}

/** Manifold charge temperature in °F, for display. */
export function manifoldTempF(boost_psi: number, intercooler_efficiency: number): number {
  return (manifoldTempK(boost_psi, intercooler_efficiency) - 273.15) * 1.8 + 32;
}

/**
 * Charge density ratio relative to ambient — how much more air mass the engine
 * ingests per unit of VE than it would naturally aspirated.
 *
 *   ρ/ρ_amb = (P_man / P_amb) · (T_amb / T_man)
 *
 * Pressure alone overstates the gain: compressing air heats it, and the
 * intercooler's effectiveness decides how much of that heat is removed. An
 * engine with no intercooler therefore makes materially less power at the same
 * boost pressure.
 */
export function boostDensityRatio(boost_psi: number, intercooler_efficiency: number): number {
  if (boost_psi <= 0) return 1;

  const pressure_ratio = 1 + boost_psi / ATM_PSI;
  return (
    pressure_ratio *
    (AMBIENT_TEMP_K / manifoldTempK(boost_psi, intercooler_efficiency))
  );
}

/**
 * Otto cycle thermal efficiency
 * η_th = 1 − CR^(1−γ)
 *
 * Real engines achieve ~80-85% of ideal Otto efficiency due to:
 * - Heat transfer losses
 * - Incomplete combustion
 * - Finite combustion duration
 * A correction factor of ~0.75–0.82 is applied based on empirical data.
 */
function thermalEfficiency(cr: number, afr: number, stoich_afr: number): number {
  // Ideal Otto cycle
  const eta_otto = 1 - Math.pow(cr, 1 - GAMMA);

  // Combustion efficiency: peaks near stoich, degrades rich/lean
  // Based on empirical SFC curves from Heywood Fig 4-32
  const lambda = afr / stoich_afr;
  let eta_comb: number;
  if (lambda < 1.0) {
    // Rich — linear falloff in combustion efficiency
    eta_comb = 0.97 - (1.0 - lambda) * 0.25;
  } else {
    // Lean — slight improvement then falls off
    eta_comb = 0.97 + (lambda - 1.0) * 0.05 - Math.pow(lambda - 1.0, 2) * 0.15;
  }
  eta_comb = Math.max(0.60, Math.min(0.99, eta_comb));

  // Ratio of actual indicated work to ideal: ~0.79 (mechanical/thermal factor)
  // This bundles heat transfer, blow-by, finite burn duration
  const eta_indicated_factor = 0.79;

  return eta_otto * eta_comb * eta_indicated_factor;
}

/**
 * Volumetric Efficiency model
 *
 * VE is modeled as a bell curve shaped by cam duration and LSA.
 * Based on empirical data from cam grinder specifications and dyno sheets:
 *
 *  - Duration (at 0.050") controls where power peaks and how broad the curve is.
 *  - LSA controls low-end vs high-end torque bias.
 *  - At idle RPM, VE is low due to reversion, rises to peak, then falls off.
 *
 * Peak VE RPM empirical relationship (from cam manufacturer data):
 *   rpm_peak_ve ≈ 2200 + (duration − 200) × 55
 *
 * Width (sigma) of the bell is asymmetric — reversion closes the curve quickly
 * below peak VE, while finite valve area only chokes it gradually above:
 *   sigma_low  ≈ 900 + (duration − 200) × 20
 *   sigma_high ≈ 1200 + (duration − 200) × 30
 *
 * VE decays toward a residual floor rather than to zero, so a real engine still
 * makes torque at redline instead of reporting no power.
 *
 * Tighter LSA = more low-end torque, narrower power band.
 * Wider LSA = broader power band, less peak VE.
 */
function computeVE(
  rpm: number,
  cam_duration: number,
  lsa: number,
  boost_psi: number,
  intercooler_efficiency: number,
  ve_preset_multiplier: number
): number {
  // Peak VE RPM — cams with more duration peak higher in the RPM range
  const rpm_peak = 2200 + (cam_duration - 200) * 55;

  // Asymmetric width — longer cams have a broader power band
  const sigma_low = 900 + (cam_duration - 200) * 20;
  const sigma_high = 1200 + (cam_duration - 200) * 30;

  // Peak VE value — very aggressive cams can reach 105%+ on race engines
  // Typical: street cam 78-85%, race cam 90-100%
  const ve_peak_base =
    0.78 + (cam_duration - 200) * 0.0015 + (ve_preset_multiplier - 0.5) * 0.12;
  const ve_peak = Math.min(1.05, Math.max(0.55, ve_peak_base));

  // LSA effect: tighter LSA shifts VE curve lower in RPM and slightly reduces peak
  // Wider LSA broadens the curve
  const lsa_rpm_shift = (112 - lsa) * 35; // tighter LSA peaks lower
  const adjusted_peak_rpm = Math.max(1000, rpm_peak - lsa_rpm_shift);
  const lsa_sigma_factor = 1.0 + (lsa - 112) * 0.02; // wider LSA = wider curve

  const sigma =
    (rpm <= adjusted_peak_rpm ? sigma_low : sigma_high) * lsa_sigma_factor;

  // Asymmetric bell, normalised to 1.0 at peak VE
  const bell = Math.exp(
    -Math.pow(rpm - adjusted_peak_rpm, 2) / (2 * Math.pow(sigma, 2))
  );

  // Residual VE floor: the head still flows at redline, so VE decays toward this
  // value instead of zero. A pure bell reaches ~5% by redline, which made the
  // engine report 0 hp long before the rev limit.
  const ve_floor = Math.max(0.25, 0.32 + (cam_duration - 200) * 0.0008);
  const ve_with_floor = ve_floor + (ve_peak - ve_floor) * bell;

  // Boost densifies the charge. The density ratio accounts for the pressure rise
  // *and* the temperature rise of compression, with intercooler effectiveness
  // deciding how much of that heat is removed.
  const density_ratio = boostDensityRatio(boost_psi, intercooler_efficiency);
  const ve_boosted = ve_with_floor * density_ratio;

  return Math.max(0.05, ve_boosted);
}

/**
 * Friction Mean Effective Pressure (FMEP) model
 *
 * Based on Chen-Flynn correlation (empirical from Heywood):
 *   FMEP ≈ C0 + C1 * piston_speed_m_s
 *   Typical: C0 = 0.4 bar, C1 = 0.009 bar/(m/s)
 *
 * We use a simplified version in psi:
 *   fmep_psi ≈ 5.8 + 0.013 * rpm  (empirical for a well-built engine)
 *
 * Returns friction HP.
 */
function frictionHP(rpm: number, displacement_ci: number, stroke_in: number): number {
  // Mean piston speed: S_p = 2 * stroke * rpm / 12 (ft/min)
  const mean_piston_speed_fpm = (2 * stroke_in * rpm) / 12;

  // FMEP in psi (empirical, accounts for bearing friction, piston ring drag, etc.)
  const fmep_psi = 5.8 + 0.0065 * rpm + 0.00000008 * rpm * rpm;

  // FHP = (FMEP * displacement_ci * RPM) / (2 * 792000)
  // Derivation: FHP = FMEP[lb/in²] × L[in³] × N[rev/min] / (2 × 6600 × 60)
  // Factor 2 for 4-stroke (power stroke every 2 revs)
  const fhp = (fmep_psi * displacement_ci * rpm) / (2 * 792_000);

  // Pumping losses (for N/A): approximate using mean piston speed
  const pumping_hp = mean_piston_speed_fpm * displacement_ci * 0.000003;

  return fhp + pumping_hp;
}

/**
 * Full engine simulation at a given RPM point.
 */
function simulatePoint(rpm: number, params: EngineParams): DynoPoint {
  const fuel = FUEL_PROPERTIES[params.fuel_type];

  // 1. Volumetric Efficiency
  const ve = computeVE(
    rpm,
    params.cam_duration,
    params.lsa,
    params.boost_psi,
    params.intercooler_efficiency,
    params.ve_preset
  );

  // 2. Airflow (CFM) — 4-stroke: each cylinder fires once every 2 revolutions
  //    CFM = displacement_ci × rpm × VE / (2 × 1728 in³/ft³)
  const cfm = (params.displacement_ci * rpm * ve) / (2 * 1728);

  // 3. Mass Air Flow (lb/min)
  const maf_lbmin = cfm * RHO_AIR_STD;

  // 4. Fuel Mass Flow (lb/min)
  const fmf_lbmin = maf_lbmin / params.afr;

  // 5. Thermal efficiency (Otto cycle × combustion efficiency × real-engine factor)
  const eta_th = thermalEfficiency(params.compression_ratio, params.afr, fuel.stoich_afr);

  // 6. Indicated Power (HP)
  //    Chemical energy released: Q = fmf [lb/min] × LHV [BTU/lb]
  //    P_indicated = Q × eta_th / 42.44 [BTU/min per HP]
  const q_btu_min = fmf_lbmin * fuel.lhv;
  const ihp = q_btu_min * eta_th * HP_PER_BTU_MIN;

  // 7. Friction losses
  const fhp = frictionHP(rpm, params.displacement_ci, params.stroke_in);

  // 8. Brake HP = Indicated HP - Friction HP
  let bhp = Math.max(0, ihp - fhp);

  // 9. Torque from HP
  //    HP = (Torque [lb·ft] × RPM) / 5252
  const torque = rpm > 0 ? (bhp * 5252) / rpm : 0;

  // 10. BSFC (Brake Specific Fuel Consumption, lb/HP·hr)
  //    BSFC = fuel_flow [lb/hr] / BHP
  const fuel_flow_lbhr = fmf_lbmin * 60;
  const bsfc = bhp > 1 ? fuel_flow_lbhr / bhp : 99;

  return {
    rpm,
    torque_lbft: Math.max(0, torque),
    hp: Math.max(0, bhp),
    ve,
    cfm,
    maf_lbmin,
    fuel_flow_lbmin: fmf_lbmin,
    thermal_efficiency: eta_th,
    fhp,
    ihp,
    bsfc,
  };
}

/**
 * Run the full dyno sweep from idle to redline.
 * Uses 50 RPM steps so the sampled curve matches the 50 RPM scrubber.
 */
export function runDyno(params: EngineParams): DynoResult {
  const step = 50;
  const points: DynoPoint[] = [];

  for (let rpm = params.idle_rpm; rpm <= params.redline_rpm; rpm += step) {
    points.push(simulatePoint(rpm, params));
  }
  // Always include redline
  if (points[points.length - 1].rpm < params.redline_rpm) {
    points.push(simulatePoint(params.redline_rpm, params));
  }

  const peak_hp_point = points.reduce((a, b) => (a.hp > b.hp ? a : b));
  const peak_torque_point = points.reduce((a, b) =>
    a.torque_lbft > b.torque_lbft ? a : b
  );
  const peak_cfm_point = points.reduce((a, b) => (a.cfm > b.cfm ? a : b));

  return {
    points,
    peak_hp: peak_hp_point.hp,
    peak_hp_rpm: peak_hp_point.rpm,
    peak_torque: peak_torque_point.torque_lbft,
    peak_torque_rpm: peak_torque_point.rpm,
    peak_cfm: peak_cfm_point.cfm,
  };
}

/**
 * Derive displacement from bore, stroke, and cylinder count.
 * Returns cubic inches.
 */
export function boreStrokeToDisplacement(
  bore_in: number,
  stroke_in: number,
  cylinders: number
): number {
  return (Math.PI / 4) * bore_in * bore_in * stroke_in * cylinders;
}

/**
 * Convert cubic inches to liters.
 */
export function ciToLiters(ci: number): number {
  return ci * 0.016387;
}

/**
 * Convert liters to cubic inches.
 */
export function litersToCi(l: number): number {
  return l / 0.016387;
}

export const HP_TO_KW = 0.7457;

/**
 * Convert brake horsepower to kilowatts (1 hp = 745.7 W).
 */
export function hpToKw(hp: number): number {
  return hp * HP_TO_KW;
}

/** Reference vehicle mass for the 0-60 estimate, in kg (~3,500 lb). */
const ZERO_SIXTY_REFERENCE_MASS_KG = 1600;

/**
 * Rough 0-60 mph estimate from peak crank horsepower.
 *
 * A dyno measures engine output, not vehicle acceleration, so this assumes a
 * fixed reference car and a single effectiveness factor rather than claiming a
 * measured result. Effective power is ~45% of peak at the wheels once drivetrain
 * loss, a traction-limited launch, shift gaps and drag are accounted for.
 *
 * Energy method: ½·m·v² = η·P·t  →  t = m·v² / (2·η·P)
 *
 * Returns null when there is no meaningful power to accelerate with.
 */
export function estimateZeroToSixtySeconds(peakHp: number): number | null {
  if (!(peakHp > 1)) return null;

  const targetSpeed = 26.82; // m/s, i.e. 60 mph
  const effectiveWatts = 0.45 * hpToKw(peakHp) * 1000;

  return (
    (ZERO_SIXTY_REFERENCE_MASS_KG * targetSpeed * targetSpeed) /
    (2 * effectiveWatts)
  );
}

export const DEFAULT_PARAMS: EngineParams = {
  displacement_ci: 350,
  cylinders: 8,
  compression_ratio: 10.0,
  bore_in: 4.0,
  stroke_in: 3.48,
  cam_duration: 220,
  lsa: 112,
  ve_preset: 0.5,
  fuel_type: "gasoline",
  afr: 12.8,
  boost_psi: 0,
  intercooler_efficiency: 0.75,
  idle_rpm: 700,
  redline_rpm: 6500,
};
