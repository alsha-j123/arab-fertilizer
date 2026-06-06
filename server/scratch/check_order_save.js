require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

async function testOrder() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arab-fertilizer';
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Let's try to validate/save a dummy order
    const mockOrderData = {
      user: new mongoose.Types.ObjectId(),
      items: [{
        product: new mongoose.Types.ObjectId(),
        name: "Test Product",
        image: "http://example.com/image.jpg",
        price: 1500,
        weight: "10kg",
        quantity: 2
      }],
      subtotal: 3000,
      shippingCost: 200,
      totalAmount: 3200,
      paymentMethod: 'bank',
      paymentDetails: {
        bankName: "Meezan",
        accountName: "John Doe",
        transactionId: "TXN12345"
      },
      shippingAddress: {
        name: "John Doe",
        email: "john@example.com",
        phone: "03001234567",
        street: "123 Street",
        city: "Lahore",
        province: "Punjab",
        postalCode: "54000"
      }
    };

    console.log("Creating order...");
    const order = await Order.create(mockOrderData);
    console.log("Order created successfully:", order._id);

    // Now test with COD and null paymentDetails
    const codOrderData = {
      ...mockOrderData,
      paymentMethod: 'cod',
      paymentDetails: null
    };

    console.log("Creating COD order with null paymentDetails...");
    const codOrder = await Order.create(codOrderData);
    console.log("COD Order created successfully:", codOrder._id);

  } catch (err) {
    console.error("Error during order creation test:", err);
  } finally {
    await mongoose.disconnect();
  }
}

testOrder();
