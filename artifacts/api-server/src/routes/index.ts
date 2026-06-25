import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientesRouter from "./clientes";
import imoveisRouter from "./imoveis";
import matchesRouter from "./matches";
import dashboardRouter from "./dashboard";
import fontesRouter from "./fontes";
import connectorsRouter from "./connectors";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(clientesRouter);
router.use(imoveisRouter);
router.use(matchesRouter);
router.use(fontesRouter);
router.use(connectorsRouter);

export default router;
