import express from "express";
import { prisma } from "./db";


const app = express();

app.get("/users", async function (req, res) {
  const users = await prisma.user.findMany();
  res.json(users);

})


app.get("/health", (_req, res) => res.send("ok"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend up on http://localhost:${PORT}`);
});
