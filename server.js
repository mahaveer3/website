const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// MongoDB connection
const dbURI = 'your_mongodb_connection_string';
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

// Product schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    category: String,
    images: [String],
    amazonLink: String
});

const Product = mongoose.model('Product', productSchema);

// GET endpoint for products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
