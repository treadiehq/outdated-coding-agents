import { z } from "zod";

export const Order = z.object({
  id: z.cuid2(),
  total: z.number(),
});

export type Order = z.infer<typeof Order>;
