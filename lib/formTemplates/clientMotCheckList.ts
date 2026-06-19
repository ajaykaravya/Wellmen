export const CLIENT_MOT_CHECK_LIST = {
  id: "client-mot-check-list",
  name: "Client MOT Check List",

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
        {
          key: "sheetNo",
          label: "Sheet No",
          fieldType: "text",
        },
        {
          key: "date",
          label: "Date",
          fieldType: "date",
        },
      ],
    },

    {
      type: "checklist",
      key: "siteChecklist",
      title: "Site Checklist",

      columns: [
        "description",
        "status",
        "remark",
      ],

      rows: [
        {
          key: "check_flooring_condition",
          label: "Check The Flooring Condition",
        },
        {
          key: "door_position_check_location",
          label: "Door Position Check & Location",
        },
        {
          key: "ahu_location",
          label: "A.H.U. Location",
        },
        {
          key: "outdoor_location",
          label: "Outdoor Location",
        },
        {
          key: "electrical_wiring_diagram",
          label: "Explain Electrical Wiring Diagram / Give The Copy",
        },
        {
          key: "plumbing_line_u_track_position",
          label: "Plumbing Line U Track Position",
        },
        {
          key: "supply_return_marking_wall",
          label: "Supply & Return Marking On Wall",
        },
        {
          key: "window_position",
          label: "Window Position",
        },
        {
          key: "pass_box",
          label: "Pass Box",
        },
        {
          key: "ot_flunge_marking_diagram",
          label: "OT Flunge Marking & Diagram",
        },
        {
          key: "electrical_panel_marking",
          label: "Electrical Panel Marking",
        },
        {
          key: "ahu_marking_location",
          label: "AHU Marking On Location",
        },
        {
          key: "sample_electrical_module",
          label: "Sample Of Electrical Module",
        },
        {
          key: "sample_oxygen_point",
          label: "Sample Of Oxygen Point",
        },
      ],
    },

    {
      type: "contacts",
      key: "departmentContacts",
      title: "Department Contacts",

      columns: [
        "department",
        "name",
        "mobile",
      ],

      rows: [
        {
          key: "electrical",
          label: "Electrical",
        },
        {
          key: "fire",
          label: "Fire",
        },
        {
          key: "plumbing",
          label: "Plumbing",
        },
        {
          key: "site_supervisor",
          label: "Site Supervisor",
        },
      ],
    },
  ],
};