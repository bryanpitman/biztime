/** Routes to obtain invoives. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");


const router = new express.Router();
const db = require("../db");

/** GET / - return data about invoices:
 *  `{invoices: [{id, comp_code}, ...]}` */

router.get("/", async function (req, res, next) {
  const results = await db.query("SELECT id, comp_code FROM invoices");
  const invoices = results.rows;

  return res.status(200).json({ invoices });
});


/** GET /invoice [id]
 *return  {invoice: {id, amt, paid, add_date, paid_date,
  company: {code, name, description}}` */

router.get("/:id", async function (req, res, next) {
  const id = req.params.id;
  const iResults = await db.query(
    "SELECT id, id, amt, paid, add_date, paid_date FROM invoices WHERE id = $1", [id]);

  const invoice = iResults.rows[0];
  if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);

  const cResults = await db.query(
    `SELECT code, name, description
        FROM companies AS c
        JOIN invoices AS i
        ON c.code = i.comp_code`);
  const company = cResults.rows[0];
  invoice.company = company;


  return res.status(200).json({ invoice });
});


/** POST /[id] - create a new invoice;
 * return `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}` */
router.post("/", async function (req, res, next) {
  const { comp_code, amt } = req.body;


  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
          VALUES ($1, $2)
          RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt] //[$1 $2] filters
  );

  const invoice = result.rows[0];
  return res.status(201).json({ invoice });
});


/** PUT /[id] - updates an invoice;
 * return `{invoice: {id, comp_id, amt, paid, add_date, paid_date}}` */

router.put("/:id", async function (req, res, next) {

  const id = req.params.id;
  const results = await db.query(
    `UPDATE invoices
         SET amt= $1
         WHERE id = $2
         RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [req.body.amt, id]);
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
  return res.status(200).json({ invoice });
});

/** DELETE /[id] - delete an invoice;
 * return `{status: 'Deleted'}` */

router.delete("/:id", async function (req, res, next) {
  const results = await db.query(
    "DELETE FROM invoices WHERE id = $1 RETURNING id",
    [req.params.id],
  );
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`No matching invoice`);
  return res.status(200).json({ status: "Deleted" });
});


module.exports = router;