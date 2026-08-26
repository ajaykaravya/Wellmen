export const MOT_MEASUREMENT_SHEET_FORM = {
    "id": "mot-measurement-sheet-v2",
    "name": "MOT Measurement Sheet",
    "sections": [
        {
            "type": "header",
            "title": "Project Information",
            "fields": [
                {
                    "key": "area",
                    "label": "Area",
                    "fieldType": "text"
                },
                {
                    "key": "date",
                    "label": "Date",
                    "fieldType": "date"
                }
            ]
        },
        {
            "key": "wall",
            "type": "sizeMatrix",
            "title": "Wall",
            "descriptionLabel": "Side / S.N.",
            "columns": [
                {
                    "key": "panelType",
                    "label": "Panel Type"
                },
                {
                    "key": "size",
                    "label": "Size",
                    "children": [
                        {
                            "key": "w",
                            "label": "W (FT)"
                        },
                        {
                            "key": "h",
                            "label": "H (FT)"
                        }
                    ]
                },
                {
                    "key": "sqft",
                    "label": "Sq.Ft (Total)"
                },
                {
                    "key": "remark",
                    "label": "Remark"
                }
            ],
            "rows": [
                {
                    "key": "door_side_1",
                    "label": "Door Side 1"
                },
                {
                    "key": "door_side_2",
                    "label": "Door Side 2"
                },
                {
                    "key": "door_side_3",
                    "label": "Door Side 3"
                },
                {
                    "key": "door_side_4",
                    "label": "Door Side 4"
                },
                {
                    "key": "door_side_5",
                    "label": "Door Side 5"
                },
                {
                    "key": "door_side_6",
                    "label": "Door Side 6"
                },
                {
                    "key": "door_side_7",
                    "label": "Door Side 7"
                },
                {
                    "key": "door_side_8",
                    "label": "Door Side 8"
                },
                {
                    "key": "door_side_9",
                    "label": "Door Side 9"
                },
                {
                    "key": "door_side_10",
                    "label": "Door Side 10"
                },
                {
                    "key": "door_left_side_1",
                    "label": "Door Left Side 1"
                },
                {
                    "key": "door_left_side_2",
                    "label": "Door Left Side 2"
                },
                {
                    "key": "door_left_side_3",
                    "label": "Door Left Side 3"
                },
                {
                    "key": "door_left_side_4",
                    "label": "Door Left Side 4"
                },
                {
                    "key": "door_left_side_5",
                    "label": "Door Left Side 5"
                },
                {
                    "key": "door_left_side_6",
                    "label": "Door Left Side 6"
                },
                {
                    "key": "door_left_side_7",
                    "label": "Door Left Side 7"
                },
                {
                    "key": "door_left_side_8",
                    "label": "Door Left Side 8"
                },
                {
                    "key": "door_left_side_9",
                    "label": "Door Left Side 9"
                },
                {
                    "key": "door_left_side_10",
                    "label": "Door Left Side 10"
                },
                {
                    "key": "door_right_side_1",
                    "label": "Door Right Side 1"
                },
                {
                    "key": "door_right_side_2",
                    "label": "Door Right Side 2"
                },
                {
                    "key": "door_right_side_3",
                    "label": "Door Right Side 3"
                },
                {
                    "key": "door_right_side_4",
                    "label": "Door Right Side 4"
                },
                {
                    "key": "door_right_side_5",
                    "label": "Door Right Side 5"
                },
                {
                    "key": "door_right_side_6",
                    "label": "Door Right Side 6"
                },
                {
                    "key": "door_right_side_7",
                    "label": "Door Right Side 7"
                },
                {
                    "key": "door_right_side_8",
                    "label": "Door Right Side 8"
                },
                {
                    "key": "door_right_side_9",
                    "label": "Door Right Side 9"
                },
                {
                    "key": "door_right_side_10",
                    "label": "Door Right Side 10"
                },
                {
                    "key": "door_opp_side_1",
                    "label": "Door Opp. Side 1"
                },
                {
                    "key": "door_opp_side_2",
                    "label": "Door Opp. Side 2"
                },
                {
                    "key": "door_opp_side_3",
                    "label": "Door Opp. Side 3"
                },
                {
                    "key": "door_opp_side_4",
                    "label": "Door Opp. Side 4"
                },
                {
                    "key": "door_opp_side_5",
                    "label": "Door Opp. Side 5"
                },
                {
                    "key": "door_opp_side_6",
                    "label": "Door Opp. Side 6"
                },
                {
                    "key": "door_opp_side_7",
                    "label": "Door Opp. Side 7"
                },
                {
                    "key": "door_opp_side_8",
                    "label": "Door Opp. Side 8"
                },
                {
                    "key": "door_opp_side_9",
                    "label": "Door Opp. Side 9"
                },
                {
                    "key": "door_opp_side_10",
                    "label": "Door Opp. Side 10"
                }
            ]
        },
        {
            "key": "wallTotals",
            "type": "sizeMatrix",
            "title": "Wall Total",
            "descriptionLabel": "Panel Type",
            "columns": [
                {
                    "key": "qtyNos",
                    "label": "Qty (Nos)"
                },
                {
                    "key": "qtySqft",
                    "label": "Qty (Sq.Ft)"
                }
            ],
            "rows": [
                {
                    "key": "total_hpl_acp",
                    "label": "Total (HPL-ACP)"
                },
                {
                    "key": "total_hpl_hpl",
                    "label": "Total (HPL-HPL)"
                }
            ]
        },
        {
            "key": "ceiling",
            "type": "sizeMatrix",
            "title": "Ceiling",
            "descriptionLabel": "S.N.",
            "columns": [
                {
                    "key": "panelType",
                    "label": "Panel Type"
                },
                {
                    "key": "size",
                    "label": "Size",
                    "children": [
                        {
                            "key": "w",
                            "label": "W (FT)"
                        },
                        {
                            "key": "l",
                            "label": "L (FT)"
                        }
                    ]
                },
                {
                    "key": "sqft",
                    "label": "Sq.Ft (Total)"
                }
            ],
            "rows": [
                {
                    "key": "ceiling_1",
                    "label": "1"
                },
                {
                    "key": "ceiling_2",
                    "label": "2"
                },
                {
                    "key": "ceiling_3",
                    "label": "3"
                },
                {
                    "key": "ceiling_4",
                    "label": "4"
                },
                {
                    "key": "ceiling_5",
                    "label": "5"
                },
                {
                    "key": "ceiling_6",
                    "label": "6"
                },
                {
                    "key": "ceiling_7",
                    "label": "7"
                },
                {
                    "key": "ceiling_8",
                    "label": "8"
                },
                {
                    "key": "ceiling_9",
                    "label": "9"
                },
                {
                    "key": "ceiling_10",
                    "label": "10"
                },
                {
                    "key": "ceiling_11",
                    "label": "11"
                },
                {
                    "key": "ceiling_12",
                    "label": "12"
                },
                {
                    "key": "ceiling_13",
                    "label": "13"
                },
                {
                    "key": "ceiling_14",
                    "label": "14"
                },
                {
                    "key": "ceiling_15",
                    "label": "15"
                },
                {
                    "key": "total",
                    "label": "Total"
                }
            ]
        },
        {
            "key": "coving",
            "type": "sizeMatrix",
            "title": "Coving",
            "descriptionLabel": "Coving Type",
            "columns": [
                {
                    "key": "qty",
                    "label": "Qty"
                }
            ],
            "rows": [
                {
                    "key": "iner_with_base_8",
                    "label": "Iner With Base 8'"
                },
                {
                    "key": "iner_with_base_10",
                    "label": "Iner With Base 10'"
                },
                {
                    "key": "outer_8",
                    "label": "Outer 8'"
                },
                {
                    "key": "outer_10",
                    "label": "Outer 10'"
                },
                {
                    "key": "total",
                    "label": "Total"
                }
            ]
        },
        {
            "key": "corner",
            "type": "sizeMatrix",
            "title": "Corner",
            "descriptionLabel": "Corner Type",
            "columns": [
                {
                    "key": "qty",
                    "label": "Qty"
                },
                {
                    "key": "remark",
                    "label": "Remark"
                }
            ],
            "rows": [
                {
                    "key": "corner_iner",
                    "label": "Corner Iner"
                }
            ]
        },
        {
            "key": "flooring",
            "type": "sizeMatrix",
            "title": "Flooring",
            "descriptionLabel": "Area",
            "columns": [
                {
                    "key": "size",
                    "label": "Size",
                    "children": [
                        {
                            "key": "w",
                            "label": "W (FT)"
                        },
                        {
                            "key": "l",
                            "label": "L (FT)"
                        }
                    ]
                },
                {
                    "key": "sqft",
                    "label": "Sq.Ft (Total)"
                },
                {
                    "key": "colour",
                    "label": "Colour"
                }
            ],
            "rows": [
                {
                    "key": "center_pcs",
                    "label": "Center Pcs"
                },
                {
                    "key": "around_pcs",
                    "label": "Around Pcs"
                },
                {
                    "key": "passage",
                    "label": "Passage"
                },
                {
                    "key": "extra_4",
                    "label": "4"
                },
                {
                    "key": "extra_5",
                    "label": "5"
                },
                {
                    "key": "total",
                    "label": "Total"
                }
            ]
        },
        {
            "key": "accessoriesDoors",
            "type": "sizeMatrix",
            "title": "Accessories - Doors",
            "descriptionLabel": "Name",
            "columns": [
                {
                    "key": "qty",
                    "label": "Qty"
                },
                {
                    "key": "size",
                    "label": "Size",
                    "children": [
                        {
                            "key": "height",
                            "label": "Height"
                        },
                        {
                            "key": "width",
                            "label": "Width"
                        }
                    ]
                },
                {
                    "key": "colour",
                    "label": "Colour"
                },
                {
                    "key": "qtyTotal",
                    "label": "Qty"
                }
            ],
            "rows": [
                {
                    "key": "door_1",
                    "label": "Door"
                },
                {
                    "key": "door_2",
                    "label": "Door"
                },
                {
                    "key": "door_3",
                    "label": "Door"
                },
                {
                    "key": "door_4",
                    "label": "Door"
                }
            ]
        },
        {
            "key": "accessories",
            "type": "sizeMatrix",
            "title": "Accessories",
            "descriptionLabel": "Name",
            "columns": [
                {
                    "key": "size",
                    "label": "Size"
                },
                {
                    "key": "qty",
                    "label": "Qty"
                },
                {
                    "key": "remark",
                    "label": "Remark"
                }
            ],
            "rows": [
                {
                    "key": "riser_grill_1",
                    "label": "Riser Grill"
                },
                {
                    "key": "riser_grill_2",
                    "label": "Riser Grill"
                },
                {
                    "key": "plenum_grill_1",
                    "label": "Plenum Grill"
                },
                {
                    "key": "plenum_grill_2",
                    "label": "Plenum Grill"
                },
                {
                    "key": "plenum_grill_3",
                    "label": "Plenum Grill"
                },
                {
                    "key": "plenum_grill_4",
                    "label": "Plenum Grill"
                },
                {
                    "key": "vcd",
                    "label": "VCD"
                },
                {
                    "key": "filter_size_1",
                    "label": "Filter Size In To In"
                },
                {
                    "key": "filter_size_2",
                    "label": "Filter Size In To In"
                },
                {
                    "key": "passbox_size",
                    "label": "Passbox Size Out To Out"
                }
            ]
        },
        {
            "key": "outdoorCopperPiping",
            "type": "sizeMatrix",
            "title": "Outdoor Copper Piping",
            "descriptionLabel": "Capacity",
            "columns": [
                {
                    "key": "size",
                    "label": "Size"
                },
                {
                    "key": "qty",
                    "label": "Qty"
                },
                {
                    "key": "remark",
                    "label": "Remark"
                }
            ],
            "rows": [
                {
                    "key": "tr_3",
                    "label": "3 TR."
                },
                {
                    "key": "tr_5_5_a",
                    "label": "5.5 TR."
                },
                {
                    "key": "tr_5_5_b",
                    "label": "5.5 TR."
                }
            ]
        },
        {
            "key": "otherAccessories",
            "type": "sizeMatrix",
            "title": "Other Accessories",
            "descriptionLabel": "Name",
            "columns": [
                {
                    "key": "size",
                    "label": "Size"
                },
                {
                    "key": "qty",
                    "label": "Qty"
                },
                {
                    "key": "remark",
                    "label": "Remark"
                }
            ],
            "rows": [
                {
                    "key": "led_light",
                    "label": "LED Light"
                },
                {
                    "key": "x_ray",
                    "label": "X-Ray"
                },
                {
                    "key": "writing",
                    "label": "Writing"
                },
                {
                    "key": "touch_panel",
                    "label": "Touch Panel"
                },
                {
                    "key": "d_p_gauge",
                    "label": "D.P. Gauge"
                },
                {
                    "key": "extra_9",
                    "label": "9"
                },
                {
                    "key": "extra_10",
                    "label": "10"
                },
                {
                    "key": "extra_11",
                    "label": "11"
                },
                {
                    "key": "extra_12",
                    "label": "12"
                }
            ]
        }
    ]
}
