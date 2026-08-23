# Gulhifalhu Diesel Engine Learning Hub

A dedicated evidence-first diesel-engine learning system for STELCO Gulhifalhu Powerhouse.

## Installed generator hierarchy

- Gen 1 — Volvo Penta TAD1345GE — 360 kW
- Gen 2 — Cummins LTA10-G3 — 200 kW
- Gen 3 — Volvo Penta TWD1416GE — 500 kW
- Gen 4 — Cummins KTA50-G3 — 1000 kW

## Learning hierarchy

Powerhouse → Generator → Engine Model → System → Module → Component → Spare Part → Stock → Maintenance / Failure / Telemetry relationship.

## Evidence rule

No technical fact, operating threshold or compatibility relationship is shown as VERIFIED unless exact evidence supports it. Compatibility states are VERIFIED, FAMILY MATCH, CANDIDATE, UNVERIFIED and NOT COMPATIBLE.

## Phase 3 inventory layer

The source workbook contains 657 inventory lines. A strict diesel-engine filter currently includes 231 lines in the learning inventory. These are classified by engine system/module and remain evidence-controlled rather than being forced onto a generator.

Current compatibility state:

- VERIFIED: 0 — awaiting installed nameplate/CPL/serial confirmation
- FAMILY MATCH: 59
- CANDIDATE: 6
- UNVERIFIED: 166

Generator-linked candidate/family mappings currently include Gen 1: 11, Gen 2: 16, Gen 3: 3 and Gen 4: 41. These counts are mappings, not confirmed installed-part quantities.

Inventory data is split by system under `data/inventory/`. `data/evidence-sources.json` records the evidence registry separately from store data.

## Current OEM / technical evidence

- Volvo Penta Operator's Manual 47713970 (08-2024): Volvo 13L family including TAD1345GE-B. This remains FAMILY MATCH to Gen 1 until its exact suffix/serial is read from the physical engine label.
- STELCO procurement evidence for Cummins KTA50-G3 parts: used as model-level FAMILY MATCH evidence for Gen 4 pending installed CPL/serial verification.
- STELCO procurement evidence for Cummins LTA10-G3 / CPL 1443 parts: used as model-level FAMILY MATCH evidence for Gen 2 pending installed CPL/serial verification.
- Additional KTA50 technical parts cross-references are retained as supporting evidence, not substitutes for the installed engine nameplate.

## Development status

- Phase 1 generator hierarchy: implemented
- Phase 2 standardized systems/modules: implemented
- Phase 3 inventory-to-system/engine mapping: implemented as evidence-controlled data layer
- OEM evidence registry: implemented and expanding
- Inventory UI / filtering: next
- Diagnostic graph: next
- Maintenance graph: next
- Live telemetry: not connected; architecture only
- OEM exploded diagrams / 3D: only when source material supports accurate geometry
