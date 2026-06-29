export const SUPPLY_DUCT_CHECKING = {
    id: "supply-duct-checking",
    name: "Supply Duct Checking",

    sections: [
        {
            type: "checklist",
            key: "supplyDuctChecking",
            title: "Supply Duct Checking",

            columns: [
                "Isnpection Point",
                "Result",
                "Remarks",
            ],

            rows: [
                {
                    key: "sa-duct-as-per-drawing",
                    label: "SA duct as per drawing",
                },
                {
                    key: "main-branch-to-y-piece-duct-connection-proper",
                    label: "Main branch to Y-piece duct connection proper",
                },
                {
                    key: "supply-duct-insulation-proper-19mm-25mm",
                    label: "Supply duct insulation proper 19mm/25mm",
                },
                {
                    key: "rubber-gasket-nut-bolt-fixed-properly",
                    label: "Rubber gasket + nut bolt fixed properly",
                },
                {
                    key: "internal-corner-bending-parts-fixed-with-silicon",
                    label: "Internal corner / bending parts fixed with silicon",
                },
                {
                    key: "sa-duct-with-ahu-connection-proper",
                    label: "SA duct with ahu connection proper",
                },
                {
                    key: "acoustic-lining-provided-where-required",
                    label: "Acoustic lining provided where required",
                },
                {
                    key: "ducting-hanger-patch-channel-proper",
                    label: "Ducting hanger + patch channel proper",
                },
                {
                    key: "vcd-provided-and-operating",
                    label: "VCD provided and operating",
                },
                {
                    key: "glass-cloth-with-lag-coating-for-uv-protection",
                    label: "Glass cloth with Lag coating for uv protection",
                },
                {
                    key: "check-taper-position-as-per-drawing-21-24",
                    label: "Check taper position as per drawing(21'' & 24'')",
                },
            ],
        },
    ]
}