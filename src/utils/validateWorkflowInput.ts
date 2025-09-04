import {NextResponse} from "next/server";
import {getWorkflowTemplate, validateWorkflowInput} from "@/lib/workflow-templates";


export function validateApiWorkflowInput(templateId: string, input: any){
    if (!templateId) {
            return NextResponse.json(
                { message: "Workflow template ID not found in config" },
                { status: 500 }
            );
        }

        const template = getWorkflowTemplate(templateId);
        if (!template) {
            return NextResponse.json(
                { message: "Workflow template not found" },
                { status: 500 }
            );
        }

        // Validate workflow input if provided
        if (input) {
            const inputValidation = validateWorkflowInput(template.id, input);
            if (!inputValidation.valid) {
                return NextResponse.json(
                    {
                        message: "Workflow input validation failed",
                        errors: inputValidation.errors,
                    },
                    { status: 400 }
                );
            }
        }
}