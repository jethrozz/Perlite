import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
createRoot(document.getElementById("root")!).render(
  <Theme appearance="dark">
    <App />
  </Theme>,
);
