/** Routes about companies. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");


const router = new express.Router();
const db = require("../db");

/** GET / - returns `{companies: [{code, name}, ...]}` */

router.get("/", async function (req, res, next) {
  const results = await db.query("SELECT code, name FROM companies");
  const companies = results.rows;

  return res.status(200).json({ 'companies': companies });
});

/** GET /[code] - return data about one company:
 *  `{company: {code, name, description}` */

router.get("/:code", async function (req, res, next) {
  const code = req.params.code;
  const results = await db.query(
    "SELECT code, name, description FROM companies WHERE code = $1", [code]);
  const company = results.rows[0];
debugger
  if (company === undefined) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ 'company': company });
});


/** PATCH /[id] - update fields in company; return `{company: {code, name, description}}` */

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
  return res.json({ 'company': company });
});


module.exports = router;