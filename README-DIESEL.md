# Gulhifalhu Diesel Engine Learning Hub

This repository is being rebuilt as a dedicated evidence-first diesel-engine learning system for STELCO Gulhifalhu Powerhouse.

## Installed generator hierarchy

- Gen 1 — Volvo Penta TAD1345GE — 360 kW
- Gen 2 — Cummins LTA10-G3 — 200 kW
- Gen 3 — Volvo Penta TWD1416GE — 500 kW
- Gen 4 — Cummins KTA50-G3 — 1000 kW

## Learning hierarchy

Powerhouse → Generator → Engine Model → System → Module → Component → Spare Part → Stock → Maintenance / Failure / Telemetry relationship.

## Evidence rule

No technical fact, threshold or compatibility relationship is shown as VERIFIED unless source evidence supports it. Compatibility uses VERIFIED, FAMILY MATCH, CANDIDATE, UNVERIFIED and NOT COMPATIBLE.

## Current OEM evidence

Volvo Penta Operator's Manual 47713970 (08-2024) covers the Volvo 13L family including TAD1345GE-B. Because the powerhouse identity currently says TAD1345GE, exact suffix/serial verification remains pending the engine nameplate. The manual is therefore FAMILY MATCH evidence for Gen 1 until the installed engine plate is confirmed.

## Current status

- Phase 1 generator hierarchy: implemented
- Phase 2 standardized systems/modules: implemented
- OEM evidence layer: started
- Inventory-to-component mapping: next
- Diagnostic graph: next
- Maintenance graph: next
- Live telemetry: not connected; architecture only
- OEM exploded diagrams / 3D: only when source material supports accurate geometry
