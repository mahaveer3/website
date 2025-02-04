// app.js
const dbURI = 'mongodb+srv://mahaveerkankaria6:dKd7riYqBkgiacGu@cluster0.uuziw.mongodb.net/website?retryWrites=true&w=majority&appName=Cluster0';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb'); // Fix: Destructure MongoClient
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Create absolute path for uploads directory
const uploadsDir = path.join(__dirname, 'uploads');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

// Middleware

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://rootaccess.site'] : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection

mongoose.connect(dbURI)
  .then(() => console.log('MongoDB connected via mongoose'))
  .catch(err => console.log('Failed to connect to MongoDB', err));

// Product Schema
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    category: String, // Add category field
    images: [String], // Changed from single image to array of images
    amazonLink: String
});

const Product = mongoose.model('Products', productSchema);

// POST endpoint
app.post('/api/products', async (req, res) => {
    try {
        // Ensure images is an array even if single image is provided
        const productData = {
            ...req.body,
            images: Array.isArray(req.body.image) ? req.body.image : [req.body.image],
            category: req.body.category // Ensure category is included
        };
        delete productData.image; // Remove the single image property

        const product = new Product(productData);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add image upload endpoint
app.post('/api/uploads', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Ensure the URL uses the correct protocol and port
        const serverUrl = req.protocol + '://' + req.get('host');
        const imageUrl = `${serverUrl}/uploads/${req.file.filename}`;
        
        res.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new endpoint to delete uploaded images
app.delete('/api/uploads/:filename', (req, res) => {
    try {
        const filePath = path.join(uploadsDir, req.params.filename);
        
        // Check if file exists
        if (fs.existsSync(filePath)) {
            // Delete the file
            fs.unlinkSync(filePath);
            res.status(200).json({ message: 'File deleted successfully' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

// Add these utility functions at the top level
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(1000 + Math.random() * 2000); // Random delay between 1-3 seconds

// Update the fetch-amazon endpoint
app.post('/api/fetch-amazon', async (req, res) => {
    try {
        const { amazonUrl } = req.body;
        let finalUrl = amazonUrl;
        
        // Enhanced headers with more realistic browser fingerprint
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        };

        // Add random delay before request
        await randomDelay();

        // Handle shortened URLs
        if (amazonUrl.includes('amzn.to')) {
            try {
                const expandResponse = await axios.get(amazonUrl, {
                    maxRedirects: 5,
                    timeout: 10000,
                    headers: headers
                });
                finalUrl = expandResponse.request.res.responseUrl || amazonUrl;
                // Add delay between requests
                await randomDelay();
            } catch (error) {
                console.error('Error expanding URL:', error);
                return res.status(400).json({ error: 'Could not expand shortened URL' });
            }
        }

        // Make the main request with retry logic
        let attempts = 0;
        const maxAttempts = 3;
        let response;

        while (attempts < maxAttempts) {
            try {
                response = await axios.get(finalUrl, {
                    headers: headers,
                    timeout: 15000,
                    maxRedirects: 5
                });
                break; // Success, exit the loop
            } catch (error) {
                attempts++;
                if (attempts === maxAttempts) {
                    throw error;
                }
                // Wait longer between retries
                await delay(3000 * attempts);
            }
        }

        const $ = cheerio.load(response.data);
        
        // Add delay before processing
        await randomDelay();

        // Extract product details with multiple fallback selectors
        const name = $('#productTitle').text().trim() || 
                    $('.product-title-word-break').text().trim();
        
        let price = '';
        const priceSelectors = [
            '.a-price .a-offscreen',
            '#priceblock_ourprice',
            '.a-price-whole',
            '#price_inside_buybox',
            '.a-price',
            '#price'
        ];

        for (const selector of priceSelectors) {
            const priceElement = $(selector).first();
            if (priceElement.length) {
                price = priceElement.text().trim();
                break;
            }
        }

        // Clean up price string
        price = price.replace(/[^\d.,]/g, '');
        if (price.includes(',')) {
            price = price.replace(',', '');
        }

        // Improved description extraction
        let description = '';
        
        // First, try to get the bullet points
        const bulletPoints = [];
        $('#feature-bullets ul li').each((i, el) => {
            const text = $(el).text().trim();
            if (text && !text.toLowerCase().includes('warranty')) {
                bulletPoints.push(text);
            }
        });

        // Then get the main description
        const mainDescription = $('#productDescription').text().trim() || 
                              $('.product-description').text().trim();

        // Combine them in a format that preserves structure
        if (bulletPoints.length > 0) {
            description = `${mainDescription}\n${bulletPoints.join('\n')}`;
        } else {
            description = mainDescription;
        }

        // Clean up the description
        description = description
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .split('.')  // Split by periods
            .map(s => s.trim())  // Trim each sentence
            .filter(s => s.length > 0)  // Remove empty sentences
            .join('.\n');  // Join with period and newline

        // Extract images
        const images = [];
        
        // Try multiple image selectors for the main image
        const imageSelectors = [
            '#landingImage',
            '.imgTagWrapper img',
            '.a-dynamic-image',
            '#imgBlkFront',
            '#ebooksImgBlkFront',
            '#main-image',
            '#mainImageContainer img'
        ];

        // Extract main image with data-a-dynamic-image handling
        for (const selector of imageSelectors) {
            const imgEl = $(selector).first();
            if (imgEl.length) {
                let imgUrl = imgEl.attr('data-a-dynamic-image') || imgEl.attr('src');
                
                if (imgUrl) {
                    // Handle JSON-encoded image URLs
                    if (imgUrl.startsWith('{')) {
                        try {
                            const imageData = JSON.parse(imgUrl);
                            // Get the URL with the highest resolution
                            imgUrl = Object.keys(imageData).sort((a, b) => {
                                const [aWidth] = imageData[a];
                                const [bWidth] = imageData[b];
                                return bWidth - aWidth;
                            })[0];
                        } catch (e) {
                            console.error('Error parsing image JSON:', e);
                        }
                    }
                    
                    if (imgUrl && !images.includes(imgUrl)) {
                        images.push(imgUrl);
                    }
                }
            }
        }

        // Extract additional images from the image gallery
        $('#altImages img, #imageBlock_feature_div img').each((i, el) => {
            let src = $(el).attr('src');
            if (src) {
                // Convert thumbnail URL to full-size URL
                src = src.replace(/\._[^\.]*(\.[^\.]+)$/, '$1');
                
                // Only add if it's a valid URL and not already included
                if (src.startsWith('http') && !images.includes(src)) {
                    images.push(src);
                }
            }
        });

        // Look for high-resolution image URLs in the page source
        const pageSource = response.data;
        const hiResPattern = /'(?:https:\/\/[^']*\.(?:jpg|jpeg|png))',\s*\[\d+,\s*\d+\]/g;
        const matches = pageSource.match(hiResPattern);
        if (matches) {
            matches.forEach(match => {
                const url = match.split("'")[1];
                if (url && !images.includes(url)) {
                    images.push(url);
                }
            });
        }

        // Remove duplicate images and filter out invalid URLs
        const uniqueImages = [...new Set(images)].filter(url => 
            url && url.startsWith('http') && !url.includes('sprite')
        );

        const productDetails = {
            name: name || 'Product Name Not Found',
            price: price || '0',
            description: description || 'No description available',
            images: uniqueImages,
            amazonLink: finalUrl
        };

        // Add final delay before sending response
        await randomDelay();

        res.json(productDetails);

    } catch (error) {
        console.error('Error fetching Amazon details:', error);
        
        // Enhanced error handling
        const errorResponse = {
            error: 'Failed to fetch product details',
            details: error.message,
            code: error.response?.status || 500
        };

        // If it's a rate limit error (403 or 429)
        if (error.response?.status === 403 || error.response?.status === 429) {
            errorResponse.error = 'Rate limited by Amazon. Please try again in a few minutes.';
            return res.status(429).json(errorResponse);
        }

        res.status(500).json(errorResponse);
    }
});

// Add this near the top with other middleware
app.use(require('cors')({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// Add these new endpoints before the existing update-prices endpoint
let updateProgress = 0;
let updateClients = new Set();

app.get('/api/update-prices/progress', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial progress
    res.write(`data: ${JSON.stringify({ progress: updateProgress })}\n\n`);
    
    // Add client to set
    updateClients.add(res);
    
    // Remove client when connection closes
    req.on('close', () => {
        updateClients.delete(res);
    });
});

// Remove all existing update-prices routes and add a single clear POST endpoint
app.post('/api/update-prices', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    try {
        const products = await Product.find();
        const updates = [];
        const errors = [];
        let completedProducts = 0;
        
        // Process products in smaller batches with delays
        const batchSize = 3; // Reduced from 5
        const batches = [];
        
        for (let i = 0; i < products.length; i += batchSize) {
            batches.push(products.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            const batchPromises = batch.map(async (product) => {
                try {
                    if (!product.amazonLink) return;

                    // Add random delay between each product in batch
                    await randomDelay();

                    const response = await axios.get(product.amazonLink, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Cache-Control': 'no-cache',
                            'Pragma': 'no-cache'
                        },
                        timeout: 10000
                    });

                    const $ = cheerio.load(response.data);
                    let newPrice = null;

                    const priceSelectors = [
                        '.a-price .a-offscreen',
                        '#priceblock_ourprice',
                        '.a-price-whole',
                        '.a-price',
                        '#price_inside_buybox',
                        '#price',
                        '.price-large',
                        '[data-price]'
                    ];

                    for (const selector of priceSelectors) {
                        const priceElement = $(selector).first();
                        if (priceElement.length) {
                            let priceText = priceElement.text().trim();
                            priceText = priceText.replace(/[^\d.]/g, '');
                            newPrice = parseFloat(priceText);
                            if (!isNaN(newPrice) && newPrice > 0) {
                                newPrice = Math.round(newPrice * 100) / 100;
                                break;
                            }
                        }
                    }

                    if (newPrice && Math.abs(newPrice - product.price) > 0.01) {
                        const oldPrice = product.price;
                        product.price = newPrice;
                        await product.save();
                        updates.push({
                            name: product.name,
                            oldPrice: oldPrice.toFixed(2),
                            newPrice: newPrice.toFixed(2)
                        });
                    }

                } catch (error) {
                    console.error(`Error updating ${product.name}:`, error);
                    errors.push({ name: product.name, error: error.message });
                }

                completedProducts++;
                const progress = Math.round((completedProducts / products.length) * 100);
                res.write(`data: ${JSON.stringify({ progress })}\n\n`);
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);
            
            // Add longer delay between batches
            await delay(5000);
        }

        // Send final update
        res.write(`data: ${JSON.stringify({ 
            complete: true,
            updates,
            errors,
            totalUpdated: updates.length,
            totalProducts: products.length
        })}\n\n`);
        res.end();

    } catch (error) {
        console.error('Error in price update:', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

// GET endpoint
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT endpoint
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            images: Array.isArray(req.body.image) ? req.body.image : [req.body.image],
            category: req.body.category // Ensure category is included
        };
        delete updateData.image;

        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE endpoint
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// The server is running on IP: 127.0.0.1

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT)
  .on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is busy, trying ${PORT + 1}`);
      server.close();
      app.listen(PORT + 1, () => {
        console.log(`Server running on port ${PORT + 1}`);
      });
    } else {
      console.error('Server error:', error);
    }
  })
  .on('listening', () => {
    console.log(`Server running on port ${PORT}`);
  });