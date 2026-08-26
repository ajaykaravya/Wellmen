export const COMPLETE_SITE_CHECKING_REPORT = {

    id: "complete-site-checking-report",

    name: "Complete Site Checking Report",

    sections: [

        {
            type: "header",

            title: "Project Details",

            fields: [
                {
                    key: "area",
                    label: "Area (OT / ICU)",
                    fieldType: "text"
                },

                {
                    key: "drawingRefNo",
                    label: "Drawing Ref No",
                    fieldType: "text"
                },

                {
                    key: "date",
                    label: "Date",
                    fieldType: "date"
                },

                {
                    key: "checkedBy",
                    label: "Checked By",
                    fieldType: "text"
                }

            ]

        },


        {
            type: "completeSiteMatrix",

            key: "roomMeasurement",

            title: "Room Internal Measurement",

            columns: [

                {
                    key: "measurement",
                    label: "Measured(mm)"
                }

            ],


            rows: [

                {
                    key: "roomLength",
                    label: "Room Length"
                },

                {
                    key: "roomWidth",
                    label: "Room Width"
                },

                {
                    key: "finishedHeight",
                    label: "Finished Height"
                }

            ]

        },



        {
            type: "completeSiteMatrix",

            key: "plenumSize",

            title: "Plenum Size",

            columns: [

                {
                    key: "drawing",
                    label: "Drawing(mm)"
                },

                {
                    key: "width",
                    label: "Width(mm)"
                },

                {
                    key: "height",
                    label: "Height(mm)"
                }

            ],


            rows: [

                {
                    key: "length",
                    label: "Length"
                },

                {
                    key: "width",
                    label: "Width"
                },

                {
                    key: "height",
                    label: "Height"
                }

            ]

        },



        {
            type: "completeSiteMatrix",

            key: "centeringCheck",

            title: "Centering Check",

            columns: [

                {
                    key: "value",
                    label: "Value(mm)"
                }

            ],


            rows: [

                {
                    key: "leftWall",
                    label: "Left Wall to Plenum"
                },

                {
                    key: "rightWall",
                    label: "Right Wall to Plenum"
                },

                {
                    key: "frontWall",
                    label: "Front Wall to Plenum"
                },

                {
                    key: "backWall",
                    label: "Back Wall to Plenum"
                }

            ]

        },




        {
            type: "completeSiteSize",

            key: "ahuSize",

            title: "AHU Size",

            rows: [

                {
                    key: "ahu",
                    label: "AHU"
                }

            ]

        },



        {
            type: "completeSiteSize",

            key: "ductSize",

            title: "Supply Duct",

            rows: [

                {
                    key: "mainBranch",
                    label: "Main Branch"
                },

                {
                    key: "subBranch1",
                    label: "Sub Branch-1"
                },

                {
                    key: "subBranch2",
                    label: "Sub Branch-2"
                },

                {
                    key: "subBranch3",
                    label: "Sub Branch-3"
                }

            ]

        },



        {
            type: "completeSiteMatrix",

            key: "accessories",

            title: "Accessories",

            columns: [

                {
                    key: "measurement",
                    label: "Measurement(mm)"
                }

            ],


            rows: [

                {
                    key: "storageCabinet",
                    label: "Storage Cabinet"
                },

                {
                    key: "touchScreen",
                    label: "Touch Screen / Surgeon Panel"
                },

                {
                    key: "writingBoard",
                    label: "Writing Board"
                },

                {
                    key: "xrayBox",
                    label: "X Ray View Box"
                }

            ]

        },



        {
            type: "completeSiteMatrix",

            key: "compressor",

            title: "Compressor Checking Report",

            columns: [

                {
                    key: "5_5_ton",
                    label: "5.5 TON"
                },


                {
                    key: "3_ton",
                    label: "3 TON"
                }

            ],


            rows: [

                {
                    key: "voltage",
                    label: "Compressor Voltage"
                },


                {
                    key: "amp",
                    label: "Compressor Amp"
                },


                {
                    key: "ampReading",
                    label: "Compressor Amp Reading"
                },


                {
                    key: "suctionPressure",
                    label: "Compressor Suction Pressure"
                },


                {
                    key: "dischargePressure",
                    label: "Compressor Discharge Pressure"
                }

            ]

        }


    ]

};