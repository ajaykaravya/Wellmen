export const MOT_ELECTRIC_LINE = {
    "id": "mot-electric-line",
    "name": "MOT Electric Line",
    "sections": [
        {
            "type": "header",
            "title": "Project Information",
            "fields": [
                {
                    "key": "date",
                    "label": "Date",
                    "fieldType": "date"
                }
            ]
        },
        {
            "type": "electric",
            "key": "electric",
            "title": "Electrical",
            "columns": [
                {
                    "key": "srNo",
                    "label": "Sr. No.",
                    "source": "row"
                },
                {
                    "key": "description",
                    "label": "Description",
                    "source": "row"
                },
                {
                    "key": "subzeroApplicable",
                    "label": "Subzero / Surgeon Panel",
                    "fieldType": "select",
                    "options": [
                        "Yes",
                        "Not"
                    ]
                },
                {
                    "key": "panelRemark",
                    "label": "Remark For Subzero / Surgeon Panel Board",
                    "fieldType": "textarea",
                    "defaultFrom": "panelRemark",
                    "enabledWhen": {
                        "column": "subzeroApplicable",
                        "equals": "Yes"
                    }
                },
                {
                    "key": "purpose",
                    "label": "Purpose",
                    "fieldType": "textarea"
                },
                {
                    "key": "remark",
                    "label": "Remark",
                    "fieldType": "textarea"
                }
            ],
            "rows": [
                {
                    "key": "r1_10mm_4_core_cable_for_main_dp_panel_to_ahu_electrical_panel",
                    "srNo": "1",
                    "description": "10MM (4 Core) Cable For Main DP Panel To AHU Electrical Panel",
                    "panelRemark": "This wire goes to seprate MCB power",
                    "purpose": "For main power"
                },
                {
                    "key": "r2_4mm_4_core_cable_for_electrical_panel_to_ahu",
                    "srNo": "2",
                    "description": "4MM (4 Core) Cable For Electrical Panel To AHU",
                    "panelRemark": "This wire goes to Electrical Panel to AHU",
                    "purpose": "For AHU power"
                },
                {
                    "key": "r3_4mm_4_core_cable_for_electrical_panel_to_heater_cable",
                    "srNo": "3",
                    "description": "4MM (4 Core) Cable For Electrical Panel To Heater Cable",
                    "panelRemark": "This wire goes to Electrical Panel to Heater Cable",
                    "purpose": "For AHU heater"
                },
                {
                    "key": "r4_4mm_4_core_cable_for_electrical_panel_to_compressor_1",
                    "srNo": "4",
                    "description": "4MM (4 Core) Cable For Electrical Panel To Compressor -1",
                    "panelRemark": "This wire goes to Electrical Panel to Comrassor -1",
                    "purpose": "For COM-1 power"
                },
                {
                    "key": "r5_4mm_4_core_cable_for_electrical_panel_to_compressor_2",
                    "srNo": "5",
                    "description": "4MM (4 Core) Cable For Electrical Panel To Compressor -2",
                    "panelRemark": "This wire goes to Electrical Panel to Comrassor -2",
                    "purpose": "For COM-2 power"
                },
                {
                    "key": "r6_1_5mm_2_core_cable_for_electrical_panel_to_compressor_1",
                    "srNo": "6",
                    "description": "1.5MM (2 Core) Cable For Electrical Panel To Compressor -1",
                    "panelRemark": "This wire goes to Electrical Panel to HP/LP Comrassor -1",
                    "purpose": "For COM-1 HP/LP power"
                },
                {
                    "key": "r7_1_5mm_2_core_cable_for_electrical_panel_to_compressor_2",
                    "srNo": "7",
                    "description": "1.5MM (2 Core) Cable For Electrical Panel To Compressor -2",
                    "panelRemark": "This wire goes to Electrical Panel to HP/LP Comrassor -2",
                    "purpose": "For COM-2 HP/LP power"
                },
                {
                    "key": "r8_1_5mm_2_core_cable_for_electrical_panel_to_compressor_1",
                    "srNo": "8",
                    "description": "1.5MM (2 Core) Cable For Electrical Panel To Compressor -1",
                    "panelRemark": "This wire goes to Electrical Panel to CO command Comrassor-1",
                    "purpose": "For CP control"
                },
                {
                    "key": "r9_1_5mm_2_core_cable_for_electrical_panel_to_compressor_2",
                    "srNo": "9",
                    "description": "1.5MM (2 Core) Cable For Electrical Panel To Compressor -2",
                    "panelRemark": "This wire goes to Electrical Panel to CP Comrassor-2",
                    "purpose": "For CP control"
                },
                {
                    "key": "r10_1_5mm_2_core_cable_for_electrical_panel_to_riser",
                    "srNo": "10",
                    "description": "1.5MM (2 Core) Cable For Electrical Panel To Riser",
                    "panelRemark": "This wire goes to 12 module board near of door",
                    "purpose": "For tempeture control"
                },
                {
                    "key": "r11_1_5mm_single_core_cable_for_electrical_panel_to_erthing",
                    "srNo": "11",
                    "description": "1.5MM (Single Core) Cable For Electrical Panel To Erthing",
                    "panelRemark": "This wire goes to Electrical Panel to Erthing",
                    "purpose": "For ground"
                },
                {
                    "key": "r12_duct_6_core_sheld_cable_cat_6_sheld_cable_from_electrical_pa",
                    "srNo": "12",
                    "description": "Duct 6 Core Sheld Cable (CAT 6 Sheld Cable) From Electrical Panel To Return Duct",
                    "panelRemark": "This wire goes to Electrical Panel to Return Duct",
                    "purpose": "For tempreture controling command option"
                },
                {
                    "key": "r14_1_5mm_2_core_cable_for_electrical_panel_to_led_light_2x2",
                    "srNo": "14",
                    "description": "1.5MM (2 Core) Cable For Electrical Panel To LED Light 2X2",
                    "panelRemark": "This wire goes to 12 module board near of door",
                    "purpose": "For 2X2 light"
                },
                {
                    "key": "r15_1_5mm_2_core_cable_for_electrical_panel_to_operation_progres",
                    "srNo": "15",
                    "description": "1.5MM (2 Core) Cable For Electrical Panel To Operation Progress Light",
                    "panelRemark": "This wire goes to 8 module board near of door",
                    "purpose": "Operation progress light"
                },
                {
                    "key": "r16_1_5mm_2_core_cable_for_x_ray_view_box_to_8_modular_board",
                    "srNo": "16",
                    "description": "1.5MM (2 Core) Cable For X-Ray View Box To 8 Modular Board",
                    "panelRemark": "This wire goes to 12 module board near of door",
                    "purpose": "For X-Ray view box"
                },
                {
                    "key": "r17_1_mm_6_core_cable_for_subzero_to_electrical_panel",
                    "srNo": "17",
                    "description": "1.MM (6 Core) Cable For Subzero To Electrical Panel",
                    "panelRemark": "This wire goes to Subzero to Electrical Panel",
                    "purpose": "CP command (On/Off)"
                },
                {
                    "key": "r18_6_core_sheld_cable_cat_6_sheld_cable_from_electrical_panel_t",
                    "srNo": "18",
                    "description": "6 Core Sheld Cable (CAT 6 Sheld Cable) From Electrical Panel To Return Duct",
                    "panelRemark": "",
                    "purpose": "For HMI touch panel"
                },
                {
                    "key": "r19_1_5mm_2_core_cable_for_dgu_window_to_12_modular_board",
                    "srNo": "19",
                    "description": "1.5MM (2 Core) Cable For DGU Window To 12 Modular Board",
                    "panelRemark": "This wire goes to 12 module board to DGU window",
                    "purpose": "For DGU remote"
                },
                {
                    "key": "r20_1_5mm_2_core_cable_for_pendent_to_electrical_panel",
                    "srNo": "20",
                    "description": "1.5MM (2 Core) Cable For Pendent To Electrical Panel",
                    "panelRemark": "This wire goes to Pendent to Electrical Panel",
                    "purpose": "For pendent to electrical panel"
                },
                {
                    "key": "note_2_5_4_sq_mm_2_core_wire_for_8_modular",
                    "srNo": "Note:-",
                    "description": "2.5/4 SQ MM 2 Core Wire For 8 Modular",
                    "panelRemark": "Separate MCB / all sercuit required",
                    "purpose": "Depend on MOT medical equipment"
                },
                {
                    "key": "note_4_6_sq_mm_4_core_wire_for_8_modular",
                    "srNo": "",
                    "description": "4/6 SQ MM 4 Core Wire For 8 Modular",
                    "panelRemark": "Double dome light / video controling / camera",
                    "purpose": "Seperate poweer and switch nees add"
                },
                {
                    "key": "note_sdi_cable_2_nos_hdmi_cable_2_nos_aux_cable_1_nos_speaker_cab",
                    "srNo": "",
                    "description": "SDI Cable - 2 nos, HDMI Cable - 2 nos, AUX Cable - 1 nos, Speaker Cable - 1 nos, Power 5/15A Socket - 3 nos",
                    "panelRemark": "",
                    "purpose": "Depend on MOT medical equipment and clint need"
                }
            ]
        }
    ]
}
