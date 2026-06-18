export const MOT_SELECTION_LIST = {
    id: "mot-selection-list",
    name: "MOT selection List",

    sections: [
        {
            type: "header",
            title: "Project Information",

            fields: [
                {
                    key: "siteCode",
                    label: "Site Code",
                    fieldType: "text",
                },
                {
                    key: "roomSize",
                    label: "Room Size",
                    fieldType: "text",
                },
                {
                    key: "floorToSlabHeight",
                    label: "Floor to slab height",
                    fieldType: "text",
                },
                {
                    key: "floorToBeamBottomHeight",
                    label: "Floor to beam bottom height",
                    fieldType: "text",
                },
                {
                    key: "falseCeilingHeight",
                    label: "False cieling height",
                    fieldType: "text",
                },
                {
                    key: "AhuLocation",
                    label: "AHU Location",
                    fieldType: "text",
                },
            ]
        }
    ]
}