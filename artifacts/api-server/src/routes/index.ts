import { Router, type IRouter } from "express";
import healthRouter from "./health";
import doctorsRouter from "./doctors";
import appointmentsRouter from "./appointments";
import medicationsRouter from "./medications";
import recoveryRouter from "./recovery";
import dashboardRouter from "./dashboard";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(doctorsRouter);
router.use(appointmentsRouter);
router.use(medicationsRouter);
router.use(recoveryRouter);
router.use(dashboardRouter);
router.use(openaiRouter);

export default router;
