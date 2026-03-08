import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";
import i18n from "../i18n/config";

export const trpc = createTRPCReact<AppRouter>();

// 创建带自定义 headers 的 client
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      headers: () => {
        return {
          "x-ui-language": i18n.language || "zh",
        };
      },
    }),
  ],
});