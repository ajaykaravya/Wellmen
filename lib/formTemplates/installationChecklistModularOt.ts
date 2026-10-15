// Installation Checklist – Modular OT. Six site-installation checklists that
// are filled alongside the HVAC ones, so they are composed into
// "SOP and Check List of HVAC System" rather than offered as a separate form.
// Each row records OK / Not Ok plus a remark, the same shape as the other
// checklist sections.
const checklist = (
    key: string,
    title: string,
    rows: { key: string; label: string }[],
) => ({
    type: "checklist",
    key,
    title,

    columns: [
        "Check Point",
        "Result",
        "Remark / Reading",
    ],

    rows,
})

export const INSTALLATION_CHECKLIST_MODULAR_OT = {
    id: "installation-checklist-modular-ot",
    name: "Installation Checklist - Modular OT",

    sections: [
        checklist("wallPanel", "Wall Panel", [
            { key: "approved-drawing-and-panel-layout-at-site", label: "Approved drawing and panel layout at site" },
            { key: "panels-checked-size-colour-thickness-no-damage", label: "Panels checked: size, colour, thickness, no damage" },
            { key: "level-line-marked-on-all-walls", label: "Level line marked on all walls" },
            { key: "bottom-and-top-channel-fixed-in-one-line", label: "Bottom and top channel fixed in one line" },
            { key: "started-from-corner-or-door-side-as-per-layout", label: "Started from corner or door side as per layout" },
            { key: "panels-straight-plumb", label: "Panels straight (plumb)" },
            { key: "no-gap-between-panels", label: "No gap between panels" },
            { key: "panels-tight-not-loose", label: "Panels tight, not loose" },
            { key: "cut-outs-at-correct-place", label: "Cut-outs at correct place (switch, outlet, grille, pass box)" },
            { key: "cut-edges-covered-sealed", label: "Cut edges covered / sealed" },
            { key: "corner-profiles-fixed-straight", label: "Corner profiles fixed straight" },
            { key: "no-scratch-or-dent-film-still-on", label: "No scratch or dent, film still on" },
        ]),

        checklist("ceilingPanel", "Ceiling Panel", [
            { key: "all-work-above-ceiling-done-before-closing", label: "All work above ceiling done before closing" },
            { key: "ceiling-level-marked-on-walls", label: "Ceiling level marked on walls" },
            { key: "wall-angle-fixed-on-level-line", label: "Wall angle fixed on level line" },
            { key: "hangers-and-rods-fixed-as-per-grid", label: "Hangers and rods fixed as per grid" },
            { key: "panels-fixed-and-levelled", label: "Panels fixed and levelled" },
            { key: "ceiling-level-no-sag", label: "Ceiling level, no sag" },
            { key: "laminar-box-at-correct-place-own-support", label: "Laminar box at correct place, own support" },
            { key: "light-grille-sprinkler-cut-outs-correct", label: "Light, grille, sprinkler cut-outs correct" },
            { key: "cut-outs-trimmed-and-supported", label: "Cut-outs trimmed and supported" },
            { key: "all-joints-sealed-no-light-leak", label: "All joints sealed, no light leak" },
            { key: "no-scratch-or-mark", label: "No scratch or mark" },
        ]),

        checklist("coving", "Coving", [
            { key: "corners-cleaned-and-dry-before-fixing", label: "Corners cleaned and dry before fixing" },
            { key: "3-way-corner-pieces-fixed-first", label: "3-way corner pieces fixed first" },
            { key: "coving-in-all-corners-floor-wall-ceiling", label: "Coving in all corners (floor, wall, ceiling)" },
            { key: "floor-coving-at-finished-floor-level", label: "Floor coving at finished floor level" },
            { key: "coving-straight-same-radius", label: "Coving straight, same radius" },
            { key: "no-gap-at-joints", label: "No gap at joints" },
            { key: "silicone-on-both-sides-neat", label: "Silicone on both sides, neat" },
            { key: "no-sharp-edge-at-cut-ends", label: "No sharp edge at cut ends" },
        ]),

        checklist("flooring", "Flooring", [
            { key: "floor-base-screed-level-dry-and-crack-free", label: "Floor base (screed) level, dry and crack-free" },
            { key: "moisture-test-done-before-laying", label: "Moisture test done before laying" },
            { key: "floor-cleaned-no-dust-or-loose-particles", label: "Floor cleaned, no dust or loose particles" },
            { key: "primer-adhesive-applied-evenly", label: "Primer / adhesive applied evenly" },
            { key: "vinyl-laid-without-bubbles-or-wrinkles", label: "Vinyl laid without bubbles or wrinkles" },
            { key: "joints-heat-welded-vinyl-no-joints-visible-epoxy", label: "Joints heat-welded (vinyl) / no joints visible (epoxy)" },
            { key: "flooring-turned-up-into-coving-properly", label: "Flooring turned up into coving properly" },
            { key: "anti-static-conductive-strips-connected-to-earth", label: "Anti-static / conductive strips connected to earth (if required)" },
            { key: "floor-protected-after-laying-no-walking-till-cured", label: "Floor protected after laying - no walking till cured" },
        ]),

        checklist("door", "Door", [
            { key: "door-type-size-and-side-as-per-door-schedule", label: "Door type, size and side as per door schedule" },
            { key: "opening-size-plumb-and-square-checked", label: "Opening size, plumb and square checked" },
            { key: "opening-frame-reinforced", label: "Opening frame reinforced" },
            { key: "track-frame-fixed-level-and-straight", label: "Track / frame fixed level and straight" },
            { key: "door-leaf-hung-floor-gap-correct", label: "Door leaf hung, floor gap correct" },
            { key: "gasket-fitted-all-round", label: "Gasket fitted all round" },
            { key: "motor-sensor-and-interlock-fitted", label: "Motor, sensor and interlock fitted" },
            { key: "handle-lock-closer-kick-plate-fitted", label: "Handle, lock, closer, kick plate fitted" },
            { key: "view-panel-fixed-and-sealed", label: "View panel fixed and sealed" },
            { key: "frame-to-panel-joint-sealed-with-silicone", label: "Frame-to-panel joint sealed with silicone" },
            { key: "no-scratch-or-dent-film-still-on", label: "No scratch or dent, film still on" },
        ]),

        checklist("electricPanel", "Electric Panel", [
            { key: "panel-as-per-approved-drawing-bom", label: "Panel as per approved drawing / BOM" },
            { key: "panel-fixed-at-correct-place-and-height", label: "Panel fixed at correct place and height" },
            { key: "cable-size-as-per-drawing", label: "Cable size as per drawing" },
            { key: "cables-dressed-tagged-and-glanded", label: "Cables dressed, tagged and glanded" },
            { key: "all-terminals-tight", label: "All terminals tight" },
            { key: "mcb-mccb-contactor-ratings-correct", label: "MCB / MCCB / contactor ratings correct" },
            { key: "panel-and-all-equipment-earthed", label: "Panel and all equipment earthed" },
            { key: "panel-labelled-circuits-danger-sign", label: "Panel labelled (circuits, danger sign)" },
            { key: "panel-clean-door-closes-properly", label: "Panel clean, door closes properly" },
        ]),
    ],
}
