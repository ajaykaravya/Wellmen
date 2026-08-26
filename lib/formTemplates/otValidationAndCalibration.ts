export const OT_VALIDATION_AND_CALIBRATION = {
    id: "ot-validation-and-calibration",
    name: "OT Validation and Calibration",

    sections: [
        {
            type: "header",
            title: "Project Information",

            fields: [
                {
                    key: "area",
                    label: "Area",
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
            key: "validationDocuments",
            type: "fileUpload",
            title: "Validation and Calibration Documents",
            description:
                "Upload validation and calibration reports. Multiple PDF, DOC or DOCX files may be attached.",
            accept: ".pdf,.doc,.docx",
        },
    ],
}
