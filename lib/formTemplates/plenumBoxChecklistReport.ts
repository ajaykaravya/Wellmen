export const PLENUM_BOX_CHECKLIST_REPORT = {
    id: "plenum-box-checklist-report",
    name: "Plenum Box Checklist Report",

    sections: [
        {
            type: "checklist",
            key: "plenumBoxChecklistReport",
            title: "Plenum Box Checklist Report",

            columns: [
                "Isnpection Point",
                "Result",
                "Remarks",
            ],

            rows: [
                {
                    key: "plenum-box-size-as-per-drawing",
                    label: "Plenum box size as per drawing (Length / Width / Height)",
                },
                {
                    key: "supply-cut-out-size-as-per-approved-drawing",
                    label: "Supply cut out size as per approved drawing",
                },
                {
                    key: "return-cut-out-size-as-per-approved-drawing",
                    label: "Return cut out size as per approved drawing",
                },
                {
                    key: "hepa-frame-alignment-proper",
                    label: "HEPA frame alignment proper",
                },
                {
                    key: "internal-sealing-with-silicon-properly-done",
                    label: "Internal sealing with silicon properly done",
                },
                {
                    key: "plenum-box-level-from-all-side-direction-and-bottom",
                    label: "Plenum box level from all side direction and bottom",
                },
                {
                    key: "proper-reinforcement-support-provided",
                    label: "Proper reinforcement & support provided",
                },
                {
                    key: "hanger-threaded-rod-tightening-checked",
                    label: "Hanger / threaded rod tightening checked",
                },
                {
                    key: "13mm-insulation-properly-fixed",
                    label: "13MM Insulation (if applicable) properly fixed",
                },
                {
                    key: "gi-aluminum-sheet-thickness-as-per-specification",
                    label: "GI / Aluminum sheet thickness as per specification",
                },
                {
                    key: "powder-coating-paint-finish-proper",
                    label: "Powder coating / paint finish proper",
                },
                {
                    key: "vcd-connection-properly-sealed",
                    label: "VCD connection properly sealed",
                },
                {
                    key: "alignment-of-plenum-box",
                    label: "Alignment of Plenum box",
                },
                {
                    key: "connection-between-plenum-duct-properly-sealed",
                    label: "Connection between plenum & duct properly sealed",
                },
            ],
        },
    ]
}