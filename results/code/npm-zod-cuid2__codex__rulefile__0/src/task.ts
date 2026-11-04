import { z } from "zod";

export const OrderSchema = z.object({
  total: z.number(),
  id: z.cuid2(),
});

export type Order = z.infer<typeof OrderSchema>;
