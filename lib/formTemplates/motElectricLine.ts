export const MOT_ELECTRIC_LINE = {
    id: "mot-electric-line",
    name: "MOT Electric Line",

    sections: [
        {
            type: "header",
            title: "Project Information",

            fields: [
                {
                    key: "date",
                    label: "Date",
                    fieldType: "date",
                },
            ],
        },
        {
            type: "electric",
            key: "electric",
            title: "Remarks",

            columns: [
                "description",
                "remark_for_sub_zero",
                "remark_for_touch",
            ],

            rows: [
                {
                    key: "2.5mm_2_core_wiring_for_8_module",
                    label: "2.5 MM (2 Core) Wiring For 8 Module",
                },
                {
                    key: "1.5mm_2_core_wiring_for_2_x_2_led_light",
                    label: "1.5 MM (2 Core) Wiring For 2x2 LED Light",
                },
                {
                    key: "1_1.5mm_2_core_wiring_for_riser",
                    label: "1/1.5 MM (2 Core) Wiring For Riser",
                },
                {
                    key: "1_1.5mm_2_core_wiring_for_pendent",
                    label: "1/1.5 MM (2 Core) Wiring For Pendent",
                },
                {
                    key: "1_1.5mm_2_core_wiring_for_x_ray_view_box",
                    label: "1/1.5 MM (2 Core) Wiring For X-Ray View Box",
                },
                {
                    key: "1_1.5mm_2_core_wiring_for_window",
                    label: "1/1.5 MM (2 Core) Wiring For Window",
                },
                {
                    key: "10_mm_4_core_cable_for_main_dp_panel_to_ahu_electrical_panel",
                    label: "10 MM (4 Core) cable for Main DP Panel To AHU Electrical Panel",
                },
                {
                    key: "4_mm_4_core_cable_for_electrical_panel_to_ahu_panel",
                    label: "10 MM (4 Core) cable for Electrical Panel To AHU Panel",
                },
                {
                    key: "4_mm_4_core_cable_for_electrical_panel_to_compressor_2_1mm_3_core_cable",
                    label: "10 MM (4 Core) cable for Electrical Panel To Compressor-2 1mm (3 Core) cable",
                },
                {
                    key: "1_1.5mm_2_core_wiring_for_electrical_panel_to_subzero_panel",
                    label: "1/1.5 MM (2 Core) Wiring For Electrical Panel To Subzero Panel",
                },
                {
                    key: "flex_cable_from_electrical_panel_to_touch_panel",
                    label: "Flex Cable From Electrical Panel To Touch Panel",
                },
            ],
        }
    ]
}