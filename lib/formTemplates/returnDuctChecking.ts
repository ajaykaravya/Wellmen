export const RETURN_DUCT_CHECKING = {
    id: "return-duct-checking",
    name: "Return Duct Checking",

    sections: [
        {
            type: "checklist",
            key: "returnDuctChecking",
            title: "Return Duct Checking",

            columns: [
                "Isnpection Point",
                "Result",
                "Remarks",
            ],

            rows: [
                {
                    key: "ra-duct-as-per-drawing",
                    label: "RA duct as per drawing",
                },
                {
                    key: "main-ra-duct-branches-size-proper",
                    label: "Main RA duct / branches size proper",
                },
                {
                    key: "return-duct-insulation-proper-13mm-19mm",
                    label: "Return duct insulation proper 13mm/19mm",
                },
                {
                    key: "rubber-gasket-nut-bolt-fixed-properly",
                    label: "Rubber gasket + nut bolt fixed properly",
                },
                {
                    key: "internal-corner-bending-sealed-with-silicon",
                    label: "Internal corner / bending sealed with silicon",
                },
                {
                    key: "ra-duct-with-ahu-connection-proper",
                    label: "RA duct with ahu connection proper",
                },
                {
                    key: "acoustic-lining-where-required",
                    label: "Acoustic lining where required",
                },
                {
                    key: "hanger-patch-channel-proper",
                    label: "Hanger + patch channel proper",
                },
                {
                    key: "return-riser-position-correct",
                    label: "Return riser position correct",
                },
                {
                    key: "glass-cloth-with-lag-coating-for-uv-protection",
                    label: "Glass cloth with Lag coating for uv protection",
                },
                {
                    key: "riser-grill-size-number-as-per-design",
                    label: "Riser grill size number as per design",
                },
            ],
        },
    ]
}