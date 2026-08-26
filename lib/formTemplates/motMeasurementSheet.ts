export const MOT_MEASUREMENT_SHEET = {
    id: "mot-measurement-sheet",
    name: "MOT Selection Sheet",

    sections: [
        {
            type: "header",
            title: "Project Information",

            fields: [
                {
                    key: "siteCode",
                    label: "Site Code (Added by SG Office)",
                    fieldType: "text",
                },
                {
                    key: "roomSize",
                    label: "Room Size",
                    fieldType: "text",
                },
                {
                    key: "floorToSlabHeight",
                    label: "Floor to Slab Height",
                    fieldType: "text",
                },
                {
                    key: "floorToBeamBottomHeight",
                    label: "Floor to Beam Bottom Height",
                    fieldType: "text",
                },
                {
                    key: "falseCeilingHeightRequired",
                    label: "False Ceiling Height (Required)",
                    fieldType: "text",
                },
                {
                    key: "falseCeilingHeightActual",
                    label: "False Ceiling Height (Actual)",
                    fieldType: "text",
                },
                {
                    key: "ahuLocation",
                    label: "AHU Location",
                    fieldType: "text",
                },
                {
                    key: "ductEntryInOt",
                    label: "Duct Entry in OT",
                    fieldType: "text",
                },
            ],
        },
        {
            key: "materialSelection",
            type: "matrix",
            title: "Material Selection",
            columns: [
                {
                    key: "colour",
                    label: "Colour",
                    fieldType: "text"
                },
                {
                    key: "qty",
                    label: "QTY",
                    fieldType: "text"
                },
                {
                    key: "unit",
                    label: "Unit",
                    fieldType: "text"
                },
                {
                    key: "remark",
                    label: "Remark",
                    fieldType: "text"
                },
            ],
            groups: [
                {
                    key: "wall",
                    label: "Wall",
                    rows: [
                        {
                            key: "hpl_acp_puf",
                            label: "HPL-ACP PUF"
                        },
                        {
                            key: "hpl_hpl",
                            label: "HPL-HPL"
                        },
                        {
                            key: "pcgi",
                            label: "PCGI PUF"
                        },
                        {
                            key: "ppgi",
                            label: "PPGI PUF"
                        },
                    ]
                },
                {
                    key: "ceiling",
                    label: "Ceiling",
                    rows: [
                        {
                            key: "hpl_acp_puf",
                            label: "HPL-ACP PUF"
                        },
                        {
                            key: "hpl",
                            label: "HPL"
                        },
                        {
                            key: "pcgi_puf",
                            label: "PCGI PUF"
                        },
                        {
                            key: "ppgi_puf",
                            label: "PPGI PUF"
                        },
                    ]
                },
                {
                    key: "flooring_jeoflor",
                    label: "Flooring",
                    rows: [
                        {
                            key: "premium_plus",
                            label: "Premium Plus"
                        },
                        {
                            key: "tendy",
                            label: "Tendy + Jeoflor"
                        },
                        {
                            key: "electro",
                            label: "Electro + Jeoflor"
                        },
                        {
                            key: "somoplan_tarket",
                            label: "Somoplan - Tarket"
                        },
                        {
                            key: "torosp_tarket",
                            label: "Torosp - Tarket"
                        },
                    ]
                },
                {
                    key: "sliding_door",
                    label: "Sliding Door (HPL)",
                    rows: [
                        {
                            key: "automatic",
                            label: "Automatic"
                        },
                        {
                            key: "manual",
                            label: "Manual"
                        },
                    ]
                },
                {
                    key: "double_leaf_door",
                    label: "Double Leaf Door",
                    rows: [
                        {
                            key: "hpl",
                            label: "HPL"
                        },
                        {
                            key: "pcgi",
                            label: "PCGI"
                        },
                        {
                            key: "ppgi",
                            label: "PPGI"
                        },
                    ]
                },
                {
                    key: "single_leaf_door",
                    label: "Single Leaf Door",
                    rows: [
                        {
                            key: "hpl",
                            label: "HPL"
                        },
                        {
                            key: "pcgi",
                            label: "PCGI"
                        },
                        {
                            key: "ppgi",
                            label: "PPGI"
                        },
                    ]
                },
                {
                    key: "pendant",
                    label: "Pendant",
                    rows: [
                        {
                            key: "single_arm",
                            label: "Single Arm"
                        },
                        {
                            key: "double_arm",
                            label: "Double Arm"
                        },
                        {
                            key: "fix_arm",
                            label: "Fix Arm"
                        },
                    ]
                },
                {
                    key: "writing_board",
                    label: "Writing Board",
                    rows: [
                        {
                            key: "writing_board",
                            label: "Writing Board"
                        },
                    ]
                },
                {
                    key: "x_ray_view_box",
                    label: "X-Ray View Box",
                    rows: [
                        {
                            key: "double_film",
                            label: "Double Film"
                        },
                        {
                            key: "triple_film",
                            label: "Triple Film"
                        },
                    ]
                },
                {
                    key: "view_window",
                    label: "View Window",
                    rows: [
                        {
                            key: "remote_base",
                            label: "Remote Base"
                        },
                        {
                            key: "simple",
                            label: "Simple"
                        },
                        {
                            key: "touch_panel_base",
                            label: "Touch Panel Base"
                        },
                    ]
                },
                {
                    key: "air_handling_unit",
                    label: "Air Handling Unit",
                    rows: [
                        {
                            key: "cfm_1200",
                            label: "1200 CFM"
                        },
                        {
                            key: "cfm_1500",
                            label: "1500 CFM"
                        },
                        {
                            key: "cfm_2000",
                            label: "2000 CFM"
                        },
                        {
                            key: "cfm_2500",
                            label: "2500 CFM"
                        },
                        {
                            key: "cfm_3000",
                            label: "3000 CFM"
                        },
                        {
                            key: "cfm_3500",
                            label: "3500 CFM"
                        },
                        {
                            key: "cfm_4000",
                            label: "4000 CFM"
                        },
                        {
                            key: "cfm_6000",
                            label: "6000 CFM"
                        },
                        {
                            key: "cfm_11000",
                            label: "11000 CFM"
                        },
                    ]
                },
                {
                    key: "outdoor_unit",
                    label: "Outdoor Unit",
                    rows: [
                        {
                            key: "tr_2",
                            label: "2 TR."
                        },
                        {
                            key: "tr_3",
                            label: "3 TR."
                        },
                        {
                            key: "tr_5_5",
                            label: "5.5 TR."
                        },
                        {
                            key: "tr_8_5",
                            label: "8.5 TR."
                        },
                        {
                            key: "tr_11",
                            label: "11 TR."
                        },
                    ]
                },
                {
                    key: "aluminium_coving",
                    label: "Aluminium Coving",
                    rows: [
                        {
                            key: "iner",
                            label: "Iner"
                        },
                        {
                            key: "outer",
                            label: "Outer"
                        },
                    ]
                },
                {
                    key: "aluminium_corner",
                    label: "Aluminium Corner",
                    rows: [
                        {
                            key: "iner",
                            label: "Iner"
                        },
                    ]
                },
                {
                    key: "plenum_box",
                    label: "Plenum Box",
                    rows: [
                        {
                            key: "s.s",
                            label: "S.S"
                        },
                        {
                            key: "g.i",
                            label: "G.I"
                        },
                        {
                            key: "aluminium",
                            label: "Aluminium"
                        },
                    ]
                },
                {
                    key: "g_i_ducting",
                    label: "G.I. Ducting",
                    rows: [
                        {
                            key: "excel_class_o_13mm",
                            label: "13mm Excel Class O Insulation"
                        },
                        {
                            key: "nitriade_13mm",
                            label: "13mm Nitriade Insulation"
                        },
                        {
                            key: "insulation_19mm",
                            label: "19mm Insulation"
                        },
                        {
                            key: "nitriade_19mm",
                            label: "19mm Nitriade Insulation"
                        },
                    ]
                },
                {
                    key: "aluminium_ducting",
                    label: "Aluminium Ducting",
                    rows: [
                        {
                            key: "nitriade_13mm",
                            label: "13mm Nitriade Insulation"
                        },
                        {
                            key: "nitriade_19mm",
                            label: "19mm Nitriade Insulation"
                        },
                    ]
                },
                {
                    key: "rain_canvas_lag_coating",
                    label: "Rain Canvas Lag Coating",
                    rows: [
                        {
                            key: "rain_canvas_lag_coating",
                            label: "Rain Canvas Lag Coating"
                        },
                    ]
                },
                {
                    key: "pass_box",
                    label: "Pass Box",
                    rows: [
                        {
                            key: "s.s",
                            label: "S.S"
                        },
                        {
                            key: "aluminium",
                            label: "Aluminium"
                        },
                    ]
                },
                {
                    key: "pheripheral_light",
                    label: "Pheripheral Light",
                    rows: [
                        {
                            key: "size_300x600",
                            label: "300X600"
                        },
                        {
                            key: "size_600x600",
                            label: "600X600"
                        },
                    ]
                },
                {
                    key: "storage_cabinet",
                    label: "Storage Cabinet",
                    rows: [
                        {
                            key: "aluminium",
                            label: "Aluminium"
                        },
                    ]
                },
                {
                    key: "glass_painting_with_digital_images",
                    label: "Glass Painting With Digital Images",
                    rows: [
                        {
                            key: "with_light_frame",
                            label: "With Light Frame"
                        },
                        {
                            key: "without_light_frame",
                            label: "Without Light Frame"
                        },
                    ]
                },
                {
                    key: "surgeon_panel",
                    label: "Surgeon Panel",
                    rows: [
                        {
                            key: "touch_7_1",
                            label: "Touch (7.1\")"
                        },
                        {
                            key: "touch_10_1",
                            label: "Touch (10.1\")"
                        },
                        {
                            key: "sub_zero_7_1",
                            label: "Sub Zero (7.1\")"
                        },
                        {
                            key: "sub_zero_10_1",
                            label: "Sub Zero (10.1\")"
                        },
                        {
                            key: "membrane",
                            label: "Membrane"
                        },
                    ]
                },
                {
                    key: "electrical_panel",
                    label: "Electrical Panel",
                    rows: [
                        {
                            key: "touch_panel",
                            label: "Touch Panel"
                        },
                        {
                            key: "surgeon_panel",
                            label: "Surgeon Panel"
                        },
                        {
                            key: "sub_zero_panel",
                            label: "Sub Zero Panel"
                        },
                    ]
                },
                {
                    key: "v_f_d_for_electrical_panel",
                    label: "VFD For Electrical Panel",
                    rows: [
                        {
                            key: "hp_3",
                            label: "3 HP"
                        },
                        {
                            key: "hp_5",
                            label: "5 HP"
                        },
                        {
                            key: "hp_7_50",
                            label: "7.50 HP"
                        },
                        {
                            key: "hp_10",
                            label: "10 HP"
                        },
                        {
                            key: "hp_25",
                            label: "25 HP"
                        },
                    ]
                },
                {
                    key: "hepa_filter",
                    label: "Hepa Filter",
                    rows: [
                        {
                            key: "flunge_type",
                            label: "Flunge Type"
                        },
                        {
                            key: "box_type",
                            label: "Box Type"
                        },
                    ]
                },
                {
                    key: "riser_grill",
                    label: "Riser Grill",
                    rows: [
                        {
                            key: "hpl",
                            label: "HPL"
                        },
                    ]
                },
                {
                    key: "bed_head_panel",
                    label: "Bed Head Panel",
                    rows: [
                        {
                            key: "aluminium",
                            label: "Aluminium"
                        },
                        {
                            key: "hpl",
                            label: "HPL"
                        },
                        {
                            key: "acp",
                            label: "ACP"
                        },
                    ]
                },
                {
                    key: "d_p_guage",
                    label: "D.P. Gauge",
                    rows: [
                        {
                            key: "d_p_guage",
                            label: "D.P. Gauge"
                        },
                    ]
                },
            ]
        }
    ]
}
