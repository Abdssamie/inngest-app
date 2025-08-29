import z from "zod";

export const waterQualityDataSubmitted = z.object({
  name: z.literal("app/product.submit"),
  data: z.object({ productId: z.string() }),
});

