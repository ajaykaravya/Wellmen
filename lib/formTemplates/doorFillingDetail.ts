// Door Filling Detail. Transcribed from the site sheet of the same name: the
// sheet is one long table whose numbered items each carry either a set of
// tick-box choices or a measurement to write in. Here each numbered item is a
// checklist section, so every line records OK / Not Ok plus a remark — the
// remark is where readings such as frame sizes and colours are written.
const checklist = (
    key: string,
    title: string,
    rows: { key: string; label: string }[],
) => ({
    type: "checklist",
    key,
    title,

    columns: [
        "Door Filling Details",
        "Result",
        "Remark",
    ],

    rows,
})

export const DOOR_FILLING_DETAIL = {
    id: "door-filling-detail",
    name: "Door Filling Detail",

    sections: [
        {
            type: "header",
            title: "Project Information",
            fields: [
                {
                    key: "date",
                    label: "Date",
                    fieldType: "date",
                },
            ],
        },

        checklist("doorType", "Door Type", [
            { key: "single-leaf", label: "Single Leaf" },
            { key: "double-leaf", label: "Double Leaf" },
        ]),

        checklist("doorMaterial", "Door Material", [
            { key: "hpl", label: "HPL" },
            { key: "ppgi", label: "PPGI" },
        ]),

        checklist("doorFramePosition", "Door Frame Position", [
            { key: "granite", label: "Granite" },
            { key: "pop-punning", label: "POP Punning" },
            { key: "simple-plaster", label: "Simple Plaster" },
            { key: "uneven-surface", label: "Uneven Surface" },
            { key: "hpl-acp-puff-panel", label: "HPL-ACP Puff Panel" },
            { key: "hpl-hpl-puf-panel", label: "HPL-HPL Puf Panel" },
        ]),

        // Items 4 to 9 of the sheet. These are written-in readings rather than
        // choices, so the reading goes in the remark.
        checklist("doorFrameSize", "Door Frame & Size Details", [
            { key: "door-wall-frame-size", label: "Door Wall Frame Size" },
            { key: "top-frame-in-to-in", label: "Top Frame In To In" },
            { key: "middle-frame-in-to-in", label: "Middle Frame In To In" },
            { key: "bottom-frame-in-to-in", label: "Bottom Frame In To In" },
            { key: "door-cut-out-size-l-x-h", label: "Door Cut Out Size (L x H)" },
            { key: "door-colour", label: "Door Colour" },
        ]),

        checklist("doorOpening", "Door Opening", [
            { key: "pull-side", label: "Pull Side" },
            { key: "push-side", label: "Push Side" },
        ]),

        checklist("doorLeaf", "Leaf", [
            { key: "active-leaf", label: "Active Leaf" },
            { key: "passive-leaf", label: "Passive Leaf" },
        ]),

        checklist("doorLocation", "Door Location", [
            { key: "ot-inner-side-area-pull-side", label: "OT Inner Side Area = Pull Side" },
            { key: "ot-outer-side-area-push-side", label: "OT Outer Side Area = Push Side" },
            { key: "door-location-floor", label: "Door Location Floor" },
        ]),

        checklist("doorAccessories", "Door Accessories", [
            { key: "flush-tower-bolt", label: "Flush Tower Bolt" },
            { key: "lock", label: "Lock" },
            { key: "push-and-pull-type-handle", label: "Push and Pull Type Handle" },
            { key: "vision-glass-size", label: "Vision Glass Size" },
            { key: "door-closer", label: "Door Closer" },
            { key: "door-strip-at-bottom-end", label: "Door Strip at Bottom End" },
        ]),
    ],
}
