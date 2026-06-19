export const MOT_ACCESSORIES_CUT_OUT_MEASURMENT_REPORT = {
    id: "mot-accessories-cut-out-measurement-report",

    name: "MOT & Accessories Cut-Out Measurement Report",

    sections: [

        {
            type: "header",

            title: "Project Information",

            fields: [
                {
                    key: "siteCode",
                    label: "Site Code",
                    fieldType: "text"
                },
                {
                    key: "date",
                    label: "Date",
                    fieldType: "date"
                }
            ]
        },


        {
            key: "outToOutMeasurement",

            type: "sizeMatrix",

            title: "OUT TO OUT SIZE",

            columns: [

                {
                    key: "qty",
                    label: "Qty"
                },


                {
                    key: "outSizeMM",

                    label: "OUT TO OUT SIZE (MM)",

                    children: [
                        {
                            key: "length",
                            label: "L"
                        },

                        {
                            key: "width",
                            label: "W"
                        },

                        {
                            key: "height",
                            label: "H"
                        }
                    ]
                },


                {
                    key: "outSizeInch",

                    label: "OUT TO OUT SIZE (INCH)",

                    children: [

                        {
                            key: "length",
                            label: "L"
                        },

                        {
                            key: "width",
                            label: "W"
                        },

                        {
                            key: "height",
                            label: "H"
                        }

                    ]
                },


                {
                    key: "remark",
                    label: "Remark"
                }


            ],


            rows: [

                {
                    key: "ot_size_actual_wall_to_wall",
                    label: "OT Size Actual Wall To Wall"
                },

                {
                    key: "ot_size_hpl_panel_to_panel",
                    label: "OT Size HPL Panel To Panel"
                },

                {
                    key: "air_handling_unit",
                    label: "Air Handling Unit"
                },

                {
                    key: "plenum_box",
                    label: "Plenum Box"
                }

            ]

        },

        {
            key: "inToInMeasurement",

            type: "sizeMatrix",

            title: "IN TO IN SIZE",

            columns: [

                {
                    key: "qty",
                    label: "Qty",
                    fieldType: "number"
                },


                {
                    key: "inSizeMM",
                    label: "IN TO IN SIZE (MM)",

                    children: [
                        {
                            key: "length",
                            label: "L"
                        },
                        {
                            key: "width",
                            label: "W"
                        },
                        {
                            key: "height",
                            label: "H"
                        }
                    ]
                },


                {
                    key: "inSizeInch",

                    label: "IN TO IN SIZE (INCH)",

                    children: [
                        {
                            key: "length",
                            label: "L"
                        },
                        {
                            key: "width",
                            label: "W"
                        },
                        {
                            key: "height",
                            label: "H"
                        }
                    ]
                },


                {
                    key: "orderSize",
                    label: "ORDER SIZE OF MATERIAL"
                }

            ],


            rows: [

                {
                    key: "heppa_filter",
                    label: "Heppa Filer"
                },

                {
                    key: "riser_grill",
                    label: "Riser Grill"
                },

                {
                    key: "dgu_glass",
                    label: "DGU Glass"
                },

                {
                    key: "ot_door",
                    label: "OT Door"
                },

                {
                    key: "writting_board",
                    label: "Writting Board"
                },

                {
                    key: "x_ray_view_xob",
                    label: "X-Ray View XOB"
                },

                {
                    key: "view_window",
                    label: "View Window"
                },

                {
                    key: "pass_box",
                    label: "Pass Box"
                },

                {
                    key: "storage_cabinet",
                    label: "Storage Cabinet"
                },

                {
                    key: "touch_subzero_panel",
                    label: "Touch / Subzero Panel"
                },

                {
                    key: "electrical_module",
                    label: "Electrical Module"
                },
            ]

        },

        {
            key: "floorToCelling",

            type: "sizeMatrix",

            title: "FLOOR TO CELLING",

            columns: [

                {
                    key: "qty",
                    label: "Qty"
                },


                {
                    key: "floorToCellingWall",

                    label: "FLOOR TO CELLING WALL",

                },


                {
                    key: "floorToOtCellingWall",

                    label: "FLOOR TO OT CELLING WALL",

                },


                {
                    key: "orderSize",
                    label: "ORDER SIZE OF MATERIAL"
                }


            ],


            rows: [

                {
                    key: "pendant",
                    label: "PENDANT"
                },

                {
                    key: "ot_light_single_dome_double_dome",
                    label: "OT Light Single Dome / Double Dome"
                },

            ]

        },

    ]

};