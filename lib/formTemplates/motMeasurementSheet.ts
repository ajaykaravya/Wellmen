export const MOT_MEASUREMENT_SHEET = {
    id: "mot-measurement-sheet",
    name: "MOT Measurement Sheet",

    sections: [
        {
            type: "header",
            title: "Project Information",

            fields: [
                {
                    key: "hospitalName",
                    label: "Hospital Name",
                    fieldType: "text",
                },
                {
                    key: "address",
                    label: "Address",
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
                }
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
                            label: "PCGI"
                        },
                        {
                            key: "ppgi",
                            label: "PPGI"
                        }
                    ]
                },
                {
                    key: "ceiling",
                    label: "Ceiling",
                    rows: [
                        {
                            key: "hpl_acp_puf",
                            label: "HPL ACP PUF"
                        },
                        {
                            key: "hpl",
                            label: "HPL"
                        }
                    ]
                },
                {
                    key: "flooring_jeoflor",
                    label: "Flooring Jeoflor",
                    rows: [
                        {
                            key: "premium_plus",
                            label: "Premium Plus"
                        },
                        {
                            key: "tendy",
                            label: "Tendy +"
                        },
                        {
                            key: "electro",
                            label: "Electro +"
                        }
                    ]
                },
                {
                    key: "sliding_door",
                    label: "Sliding Door",
                    rows: [
                        {
                            key: "automatic",
                            label: "Automatic"
                        },
                        {
                            key: "manual",
                            label: "Manual"
                        }
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
                            key: "ppgi",
                            label: "PPGI"
                        }
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
                            key: "ppgi",
                            label: "PPGI"
                        }
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
                        }
                    ]
                },
                {
                    key: "writing_board",
                    label: "Writing Board",
                    rows: [
                        {
                            key: "writing_board",
                            label: "Writing Board",
                        }
                    ]
                },
                {
                    key: "x_ray_view_box",
                    label: "X-Ray View Box",
                    rows: [
                        {
                            key: "x_ray_view_box",
                            label: "X-Ray View Box",
                        }
                    ]
                },
                {
                    key: "view_window",
                    label: "View Window",
                    rows: [
                        {
                            key: "remote_base",
                            label: "Remote Base",
                        },
                        {
                            key: "simple",
                            label: "Simple",
                        }
                    ]
                },
                {
                    "key": "air_handling_unit",
                    "label": "Air Handling Unit",
                    "selection": {
                        "enabled": true,
                        "type": "multiple",
                        "options": [
                            {
                                "key": "1200_cm",
                                "label": "1200 CM"
                            },
                            {
                                "key": "1500_cm",
                                "label": "1500 CM"
                            },
                            {
                                "key": "2000_cm",
                                "label": "2000 CM"
                            },
                            {
                                "key": "2500_cm",
                                "label": "2500 CM"
                            },
                            {
                                "key": "3000_cm",
                                "label": "3000 CM"
                            },
                            {
                                "key": "3500_cm",
                                "label": "3500 CM"
                            },
                            {
                                "key": "4000_cm",
                                "label": "4000 CM"
                            }
                        ]
                    }
                },
                {
                    "key": "outdoor_unit",
                    "label": "Outdoor Unit",

                    "selection": {
                        "enabled": true,
                        "type": "multiple",

                        "options": [
                            {
                                "key": "3_tr",
                                "label": "3 TR"
                            },
                            {
                                "key": "5.5_tr",
                                "label": "5.5 TR"
                            },
                            {
                                "key": "8.5_tr",
                                "label": "8.5 TR"
                            }
                        ]
                    }
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
                        }
                    ]
                },
                {
                    key: "aluminium_corner",
                    label: "Aluminium Corner",
                    rows: [
                        {
                            key: "iner",
                            label: "Iner"
                        }
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
                        }
                    ]
                },
                {
                    key: "rain_canvas_lag_coating",
                    label: "Rain Canvas Lag Coating",
                    rows: [
                        {
                            key: "rain_canvas_lag_coating",
                            label: "Rain Canvas Lag Coating",
                        }
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
                        }
                    ]
                },
                {
                    key: "pheripheral_light",
                    label: "Pheripheral Light",
                    rows: [
                        {
                            key: "pheripheral_light",
                            label: "Pheripheral Light",
                        }
                    ]
                },
                {
                    key: "storage_cabinet",
                    label: "Storage cabinet",
                    rows: [
                        {
                            key: "storage_cabinet",
                            label: "Storage cabinet",
                        }
                    ]
                },
                {
                    key: "glass_painting_with_digital_images",
                    label: "Glass Painting With Digital Images",
                    rows: [
                        {
                            key: "glass_painting_with_digital_images",
                            label: "Glass Painting With Digital Images",
                        }
                    ]
                },
                {
                    key: "electrical_panel",
                    label: "Electrical Panel",
                    rows: [
                        {
                            key: "electrical_panel",
                            label: "Electrical Panel",
                        }
                    ]
                },
                {
                    key: "v_f_d_for_electrical_panel",
                    label: "VFD For Electrical Panel",
                    rows: [
                        {
                            key: "v_f_d_for_electrical_panel",
                            label: "VFD For Electrical Panel",
                        }
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
                        }
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
                            key: "acp",
                            label: "ACP"
                        }
                    ]
                },
                {
                    key: "d_p_guage",
                    label: "D.P Guage",
                    rows: [
                        {
                            key: "d_p_guage",
                            label: "D.P Guage",
                        },
                    ]
                },
            ]
        }
    ],
} 