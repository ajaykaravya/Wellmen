"use client";

import HeaderSection from "./HeaderSection";
import ChecklistSection from "./ChecklistSection";
import ContactSection from "./ContactSection";


type Props = {
    template: any;
    formData?: any;
};

export default function FormRenderer({
    template,
    formData = {},
}: Props) {

    if (!template?.sections) {
        return (
            <div>
                No form template found
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {
                template.sections.map(
                    (section: any) => {
                        switch (section.type) {
                            case "header":
                                return (
                                    <HeaderSection
                                        key={section.title}
                                        section={section}
                                    />
                                );

                            case "checklist":

                                return (
                                    <ChecklistSection
                                        key={section.key}
                                        section={section}
                                    />
                                );

                            case "contacts":

                                return (
                                    <ContactSection
                                        key={section.key}
                                        section={section}
                                    />
                                );

                            default:
                                return null;
                        }
                    })
            }
        </div>
    );
}