import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/services/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
