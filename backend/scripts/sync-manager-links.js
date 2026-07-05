/**
 * sync-manager-links.js
 * 
 * One-time migration script to sync User.building ↔ Building.manager
 * for any existing stale data where they are out of sync.
 * 
 * Run: node scripts/sync-manager-links.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");
};

const User = require("../src/models/User");
const Building = require("../src/models/Building");

async function syncManagerLinks() {
  await connectDB();

  // 1. Find all building_managers who have a building assigned
  const managers = await User.find({ role: "building_manager", building: { $ne: null } });
  console.log(`\n📋 Found ${managers.length} building_manager(s) with a building assigned`);

  let syncCount = 0;

  for (const mgr of managers) {
    const building = await Building.findById(mgr.building);
    if (!building) {
      console.log(`  ⚠️  User "${mgr.name}" has a building ID that doesn't exist — clearing`);
      mgr.building = null;
      await mgr.save({ validateBeforeSave: false });
      continue;
    }

    const currentMgrId = building.manager ? building.manager.toString() : null;
    const expectedMgrId = mgr._id.toString();

    if (currentMgrId !== expectedMgrId) {
      console.log(`  🔧 Building "${building.name}" manager was "${currentMgrId ?? "null"}" → setting to "${expectedMgrId}" (${mgr.name})`);
      building.manager = mgr._id;
      await building.save();
      syncCount++;
    } else {
      console.log(`  ✓  Building "${building.name}" already linked to "${mgr.name}"`);
    }
  }

  // 2. Clear Building.manager where the linked user is no longer a building_manager
  const buildings = await Building.find({ manager: { $ne: null } });
  for (const b of buildings) {
    const mgrUser = await User.findById(b.manager);
    if (!mgrUser) {
      console.log(`  ⚠️  Building "${b.name}" has a manager ID that doesn't exist — clearing`);
      b.manager = null;
      await b.save();
      syncCount++;
    } else if (mgrUser.role !== "building_manager") {
      console.log(`  ⚠️  Building "${b.name}" manager "${mgrUser.name}" is not a building_manager — clearing`);
      b.manager = null;
      await b.save();
      syncCount++;
    }
  }

  console.log(`\n✅ Sync complete. ${syncCount} fix(es) applied.\n`);
  process.exit(0);
}

syncManagerLinks().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
