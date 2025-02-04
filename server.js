const express = require('express');
const cors = require('cors');
const app = express();

// Add or update CORS configuration
app.use(cors({
    origin: ['http://localhost', 'http://127.0.0.1'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Other middleware and routes

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
