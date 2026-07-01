import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { connectorRegistry } from "./connectors/registry";
import { MockConnector } from "./connectors/mock.connector";
import { HelenaConnector } from "./connectors/helena/HelenaConnector";
import { CasaLinharesConnector } from "./connectors/casalinhares/CasaLinharesConnector";

connectorRegistry.register(new MockConnector());
connectorRegistry.register(new HelenaConnector());
connectorRegistry.register(new CasaLinharesConnector());

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
