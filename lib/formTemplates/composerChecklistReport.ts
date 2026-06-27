export const COMPOSER_CHECKLIST_REPORT = {
    id: "composer-checklist-report",
    name: "Composer Checklist Report",

    sections: [
        {
            type: "checklist",
            key: "composerChecklistReport",
            title: "Composer Checklist Report",

            columns: [
                "Isnpection Point",
                "Result",
                "Remarks",
            ],

            rows: [
                {
                    key: "compressor-installation-on-stand-with-nut-bolt-properly-tightened",
                    label: "Compressor installation on stand with nut bolt properly tightened",
                },
                {
                    key: "compressor-wiring-connection-with-electrical-panel",
                    label: "Compressor wiring connection with electrical panel(HP/LP) checked",
                },
                {
                    key: "copper-piping-insulated-with-nitrile-rubber-insulation",
                    label: "Copper piping insulated with nitrile rubber insulation",
                },
                {
                    key: "expansion-valve-connected-properly-in-liquid-line",
                    label: "Expansion valve connected properly in liquid line",
                },
                {
                    key: "dryer-connected-properly-in-suction-line",
                    label: "Dryer connected properly in suction line",
                },
                {
                    key: "nitrogen-purging-and-vacum-testing-completed-properly",
                    label: "Nitrogen purging and vacum testing completed properly",
                },
                {
                    key: "outdoor-fan-direction-and-position-checked",
                    label: "Outdoor fan direction and position checked",
                },
                {
                    key: "compressor-earthing-checked",
                    label: "Compressor earthing checked",
                },
                {
                    key: "compressor-voltage-and-phase-sequence-checked",
                    label: "Compressor voltage and phase sequence checked",
                },
                {
                    key: "compressor-oil-level-checked",
                    label: "VFD set & airflow balancing planned",
                },
            ],
        },
    ]
}