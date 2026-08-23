# Gulhifalhu Diesel Engine Learning Hub

A dedicated evidence-first diesel-engine learning system for STELCO Gulhifalhu Powerhouse.

## Installed generator hierarchy

- Gen 1 — Volvo Penta TAD1345GE — 360 kW
- Gen 2 — Cummins LTA10-G3 — 200 kW
- Gen 3 — Volvo Penta TWD1416GE — 500 kW
- Gen 4 — Cummins KTA50-G3 — 1000 kW

## Learning hierarchy

Powerhouse → Generator → Engine Model → System → Module → Component → Spare Part → Maintenance / Failure / Telemetry relationship.

## Evidence rule

No technical fact, operating threshold or compatibility relationship is shown as VERIFIED unless exact evidence supports it. Compatibility states are VERIFIED, FAMILY MATCH, CANDIDATE, UNVERIFIED and NOT COMPATIBLE.

## Spare-parts learning layer

The source workbook contains 657 inventory lines. A strict diesel-engine filter currently includes 231 spare-part records for the learning system. Store quantities remain in the source data but are intentionally not displayed in the learning interface.

Current compatibility state:

- VERIFIED: 0 — awaiting installed nameplate/CPL/serial confirmation
- FAMILY MATCH: 59
- CANDIDATE: 6
- UNVERIFIED: 166

Generator-linked candidate/family mappings currently include Gen 1, Gen 2, Gen 3 and Gen 4 relationships. These are evidence-controlled mappings, not proof of installed compatibility.

## Visual learning UI

The current `index.html` includes:

- Four installed generator profiles
- Ten engine-system infographic cards
- Distinct functional schematics for air/exhaust, fuel, lubrication, cooling, combustion, crank mechanism, valve train, starting/charging, control/protection and service/sealing
- Clickable module list under every system
- Full technical infographic in the module detail drawer
- Spare-parts library with no stock quantities
- Search by item, description or part number
- Generator, system and confidence filters
- Part-detail learning view with system/module infographic
- Evidence-controlled compatibility badges
- Diagnostic relationship views for SPN 100, 110, 102 and 190
- Maintenance learning views linked to engine systems

All generated system/module visuals are explicitly labelled as learning schematics, not OEM geometry.

## Current OEM / technical evidence

- Volvo Penta Operator's Manual 47713970 (08-2024): Volvo 13L family including TAD1345GE-B. This remains FAMILY MATCH to Gen 1 until its exact suffix/serial is read from the physical engine label.
- STELCO procurement evidence for Cummins KTA50-G3 parts: used as model-level FAMILY MATCH evidence for Gen 4 pending installed CPL/serial verification.
- STELCO procurement evidence for Cummins LTA10-G3 / CPL 1443 parts: used as model-level FAMILY MATCH evidence for Gen 2 pending installed CPL/serial verification.
- Additional KTA50 technical parts cross-references are retained as supporting evidence, not substitutes for the installed engine nameplate.

## Development status

- Generator hierarchy: implemented
- Standardized systems/modules: implemented
- Spare-part system/engine mapping: implemented
- Visible system infographics: implemented
- Spare-parts learning UI without stock quantities: implemented
- Diagnostic graph: first OEM-backed layer implemented
- Maintenance graph: first OEM-backed layer implemented
- OEM evidence registry: implemented and expanding
- Live telemetry: not connected; architecture only
- OEM exploded diagrams / 3D: only when source material supports accurate geometry
