/** Routes about companies. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");


const router = new express.Router();
const db = require("../db");

/** GET / - returns `{companies: [{code, name}, ...]}` */

router.get("/", async function (req, res, next) {
  const results = await db.query("SELECT code, name FROM companies");
  const companies = results.rows;

  return res.status(200).json({ companies });
});

/** GET /[code] - return data about one company:
 *  `{company: {code, name, description, invoices: [id, ...]}}` */

router.get("/:code", async function (req, res, next) {
  const code = req.params.code;
  const cResults = await db.query(
    "SELECT code, name, description FROM companies WHERE code = $1", [code]);
  const company = cResults.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);

  const iResults = await db.query(
    `SELECT id, comp_code, amt, paid, add_date, paid_date
        FROM invoices AS i
        JOIN companies AS c
        ON c.code = i.comp_code
        WHERE c.code = $1`, [code]);
  const invoices = iResults.rows;
  company.invoices = invoices;

  return res.status(200).json({ company });
});

/** POST /[code] - create a new company;
 * return `{company: {code, name, description}}` */
router.post("/", async function (req, res, next) {
  const { code, name, description } = req.body;

  const findCode = await db.query(
    `SELECT code FROM companies WHERE code = $1`,
    [code]
  );

  if (findCode.rows[0]) throw new BadRequestError(`${code} already exists`);

  const result = await db.query(
    `INSERT INTO companies (code, name, description)
          VALUES ($1, $2, $3)
          RETURNING code, name, description`,
    [code, name, description]
  );

  const company = result.rows[0];
  return res.status(201).json({ company });
});


/** PATCH /[code] - update fields in company;
 * return `{company: {code, name, description}}` */

router.patch("/:code", async function (req, res, next) {
  if ("code" in req.body) throw new BadRequestError("Not allowed");

  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
         SET name=$1,
             description = $2
         WHERE code = $3
         RETURNING code, name, description`,
    [req.body.name, req.body.description, code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.status(200).json({ company });
});

/** DELETE /[code] - delete a company;
 * return `{status: 'Deleted'}` */

router.delete("/:code", async function (req, res, next) {
  const cResults = await db.query(
    "DELETE FROM companies WHERE code = $1 RETURNING code",
    [req.params.code],
  );
  const company = cResults.rows[0];

  if (!company) throw new NotFoundError(`No matching company`);
  return res.status(200).json({ status: "Deleted" });
});


module.exports = router;