export const AHU_CHECKLIST_REPORT = {
    id: "ahu-checklist-report",
    name: "AHU Checklist Report",

    sections: [
        {
            type: "checklist",
            key: "ahuChecklistReport",
            title: "AHU Checklist Report",

            columns: [
                "Isnpection Point",
                "Result",
                "Remarks",
            ],

            rows: [
                {
                    key: "ahu-section-door-properly-installed-with-gasket-silicon",
                    label: "AHU section door properly installed with gasket/silicon",
                },
                {
                    key: "ahu-in-proper-level-above-floor",
                    label: "AHU in proper level above floor",
                },
                {
                    key: "flexible-rubber-pad-connection-proper",
                    label: "Flexible / rubber pad connection proper",
                },
                {
                    key: "ahu-damper-open-close-position-working",
                    label: "AHU damper open close / position working",
                },
                {
                    key: "coil-filter-section-clean-and-fitted",
                    label: "Coil / filter section clean and fitted",
                },
                {
                    key: "drain-trap-prooper-slop-checked",
                    label: "Drain trap prooper slop checked",
                },
                {
                    key: "ahu-colling-coil-connection-with-expansion-valve-and-dryer",
                    label: "AHU colling coil connection with expansion valve and dryer",
                },
                {
                    key: "motor-and-blower-fan-position-balancing-and-direction-of-fan",
                    label: "Motor and blower fan position, balancing and direction of fan",
                },
                {
                    key: "electrical-connection-of-ahu",
                    label: "Electrical connection of AHU",
                },
                {
                    key: "vfd-set-airflow-balancing-planned",
                    label: "VFD set & airflow balancing planned",
                },
            ],
        },
    ]
}