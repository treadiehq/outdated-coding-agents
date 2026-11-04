import { z } from "zod";

export const OrderSchema = z.object({
  id: z.cuid2(),
  total: z.number(),
});

export type Order = z.infer<typeof OrderSchema>;
