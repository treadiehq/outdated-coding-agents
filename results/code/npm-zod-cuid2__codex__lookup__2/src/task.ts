import { z } from "zod";

export const Order = z.object({
  total: z.number(),
  id: z.cuid2(),
});
