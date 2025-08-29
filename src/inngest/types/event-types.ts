import {z} from "zod";

export const EventName = z.enum([
    "app/product.submit",
    "app/user.signup",
    "billing/invoice.paid",
    "billing/invoice.failed",
]);

export const EventPayload = z.object({
    name: EventName,
    data: z.record(z.string(), z.any()),
});

export const UserSignupPayload = EventPayload.extend({
    name: z.literal("app/user.signup"),
    data: z.object({
        userId: z.string(),
        email: z.string(),
    }),
});

export const ProductSubmitPayload = EventPayload.extend({
    name: z.literal("app/product.submit"),
    data: z.object({
        productId: z.string(),
    }),
});

export const InvoicePaidPayload = EventPayload.extend({
    name: z.literal("billing/invoice.paid"),
    data: z.object({
        invoiceId: z.string(),
        amount: z.number(),
    }),
});

export const InvoiceFailedPayload = EventPayload.extend({
    name: z.literal("billing/invoice.failed"),
    data: z.object({
        invoiceId: z.string(),
        reason: z.string(),
    }),
});

export type UserSignupPayload = z.infer<typeof UserSignupPayload>;
export type ProductSubmitPayload = z.infer<typeof ProductSubmitPayload>;
export type InvoicePaidPayload = z.infer<typeof InvoicePaidPayload>;
export type InvoiceFailedPayload = z.infer<typeof InvoiceFailedPayload>;
export type EventPayload = z.infer<typeof EventPayload>;
export type EventName = z.infer<typeof EventName>;
