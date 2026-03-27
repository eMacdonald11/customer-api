import { createApp } from "./app.js";
import { InMemoryStore } from "./lib/store.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const store = new InMemoryStore();
const app = createApp(store);

app.listen(port, () => {
  console.log(`Customer API listening on http://localhost:${String(port)}`);
});
