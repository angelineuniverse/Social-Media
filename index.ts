import express from "express";
import bodyParser from "body-parser";
import http from "http";
import env from "dotenv";
import wa from "./whatsapp/routers.ts";
const apps = express();
const httpServer = http.createServer(apps);
env.config();
const port = process.env.PORT ?? 8000;

apps.use(bodyParser.json());
apps.use(bodyParser.urlencoded({ extended: true }));
apps.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-token"
  );
  if ("OPTIONS" == req.method) res.sendStatus(200);
  else next();
});

apps.use('/wa', wa);

const callback = async () => {
  console.log(`Server started on http://localhost:${port}`);
};
httpServer.listen(port, async () => callback());
