import JsonModel from './utils/JsonModel.js';
import connectDB from './config/database.js';

const runTests = async () => {
    console.log("🧪 Starting Simplified JSON DB Tests...");

    // 1. Initialize DB
    await connectDB();
    console.log("✅ DB Connected");

    // Define a temporary test model instance
    const TestItem = new JsonModel('TestItem', {
        name: { type: String, required: true },
        value: { type: Number, default: 0 }
    });

    try {
        // 2. Test Create
        console.log("\n--- Testing Create ---");
        const item = await TestItem.create({ name: 'Test Item', value: 42 });
        console.log("✅ Created:", item);

        if (!item._id) throw new Error("ID not generated");
        if (item.name !== 'Test Item') throw new Error("Name mismatch");

        // 3. Test FindById
        console.log("\n--- Testing FindById ---");
        const found = await TestItem.findById(item._id);
        console.log("✅ Found:", found);

        if (!found) throw new Error("Item not found");
        if (found._id !== item._id) throw new Error("ID mismatch");

        // 4. Test Update
        console.log("\n--- Testing Update ---");
        await TestItem.updateOne({ _id: item._id }, { name: 'Updated Name' });
        const updated = await TestItem.findById(item._id);
        console.log("✅ Updated:", updated);

        if (updated.name !== 'Updated Name') throw new Error("Update failed");

        // 5. Test Delete
        console.log("\n--- Testing Delete ---");
        await TestItem.deleteOne({ _id: item._id });
        const deleted = await TestItem.findById(item._id);

        if (!deleted) {
            console.log("✅ Deleted successfully");
        } else {
            console.error("❌ Delete failed, item still exists");
        }

    } catch (err) {
        console.error("❌ Tests Failed:", err);
        process.exit(1);
    }

    console.log("\n✅ All Simplified Tests Completed");
    process.exit(0);
};

runTests();
