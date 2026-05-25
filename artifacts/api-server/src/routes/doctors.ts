import { Router, type IRouter } from "express";
import { db, doctorsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  GetDoctorParams,
  GetDoctorResponse,
  ListDoctorsQueryParams,
  ListDoctorsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/doctors", async (req, res): Promise<void> => {
  const query = ListDoctorsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let doctors = await db.select().from(doctorsTable).orderBy(doctorsTable.name);

  if (query.data.specialty) {
    doctors = doctors.filter((d) =>
      d.specialty.toLowerCase().includes(query.data.specialty!.toLowerCase())
    );
  }
  if (query.data.available !== undefined) {
    doctors = doctors.filter((d) => d.available === query.data.available);
  }

  res.json(ListDoctorsResponse.parse(doctors));
});

router.get("/doctors/:id", async (req, res): Promise<void> => {
  const params = GetDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doctor] = await db
    .select()
    .from(doctorsTable)
    .where(eq(doctorsTable.id, params.data.id));

  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  res.json(GetDoctorResponse.parse(doctor));
});

export default router;
