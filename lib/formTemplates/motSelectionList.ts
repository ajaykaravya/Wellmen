export const MOT_SELECTION_LIST = {
    id: "mot-selection-list",

    name: "MOT Selection List",

    sections: [
        {
            type: "header",
            title: "Project Information",

            fields: [
                {
                    key: "siteCode",
                    label: "Site Code (Added by SG Office)",
                    fieldType: "text"
                },
                {
                    key: "roomSize",
                    label: "Room Size",
                    fieldType: "text"
                },
                {
                    key: "floorToSlabHeight",
                    label: "Floor to Slab Height",
                    fieldType: "text"
                },
                {
                    key: "floorToBeamBottomHeight",
                    label: "Floor to Beam Bottom Height",
                    fieldType: "text"
                },
                {
                    key: "falseCeilingHeightRequired",
                    label: "False Ceiling Height (Required)",
                    fieldType: "text"
                },
                {
                    key: "falseCeilingHeightActual",
                    label: "False Ceiling Height (Actual)",
                    fieldType: "text"
                },
                {
                    key: "ahuLocation",
                    label: "AHU Location",
                    fieldType: "text"
                },
                {
                    key: "ductEntryOT",
                    label: "Duct Entry in OT",
                    fieldType: "text"
                }
            ]
        },
        {
            key: "materialSelection",
            type: "matrix",
            title: "Material Selection",
            columns: [
                {
                    key: "shadeCode",
                    label: "Shade Code",
                    fieldType: "text"
                },
                {
                    key: "colour",
                    label: "Colour",
                    fieldType: "text"
                },
                {
                    key: "size",
                    label: "Size",
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
                            key: "hpl_hpl_puf",
                            label: "HPL-HPL PUF"
                        }
                    ]
                },
                {
                    key: "ceiling",
                    label: "Ceiling",
                    rows: [
                        {
                            key: "hpl_puf",
                            label: "HPL PUF"
                        },
                        {
                            key: "acp",
                            label: "ACP"
                        }
                    ]
                },
                {
                    key: "flooring",
                    label: "Flooring",
                    rows: [
                        {
                            key: "mipolam_ambiance_ultra",
                            label: "MIPOLAM AMBIANCE ULTRA"
                        },
                        {
                            key: "mipolam_180",
                            label: "MIPOLAM 180"
                        },
                        {
                            key: "el_5",
                            label: "EL-5"
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
                                "key": "1800_cm",
                                "label": "1800 CM"
                            },
                            {
                                "key": "2000_cm",
                                "label": "2000 CM"
                            },
                            {
                                "key": "2200_cm",
                                "label": "2200 CM"
                            },
                            {
                                "key": "2400_cm",
                                "label": "2400 CM"
                            },
                            {
                                "key": "2600_cm",
                                "label": "2600 CM"
                            },
                            {
                                "key": "2800_cm",
                                "label": "2800 CM"
                            },
                            {
                                "key": "3000_cm",
                                "label": "3000 CM"
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
                                "key": "4_tr",
                                "label": "4 TR"
                            },
                            {
                                "key": "5_tr",
                                "label": "5 TR"
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
            ]
        }
    ]
};