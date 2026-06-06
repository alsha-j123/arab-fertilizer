const mongoose = require('mongoose');
const Order = require('../models/Order');

async function testValidation() {
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
    paymentMethod: 'cod',
    paymentDetails: null,
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

  const order = new Order(mockOrderData);
  try {
    await order.validate();
    console.log("Validation passed successfully!");
  } catch (err) {
    console.error("Validation failed:", err);
  }
}

testValidation();
