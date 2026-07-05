const express = require("express");
const { createLog, getLogs, updateLog, deleteLog } = require("../controllers/security.controller");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");

const router = express.Router();

router.use(protect);
router.use(restrictTo("super_admin", "building_manager", "security_staff"));

router.route("/")
  .post(createLog)
  .get(getLogs);

router.route("/:id")
  .patch(updateLog)
  .delete(deleteLog);

module.exports = router;
