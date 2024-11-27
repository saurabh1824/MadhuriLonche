
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid'); // For unique IDs
const bcrypt = require('bcryptjs'); // Import bcryptjs password hashing
const cors = require('cors'); // To handle CORS
const fs = require('fs'); // to check file existence
const path = require('path');
const QRCode = require("qrcode");
 
const app = express();
const PORT = process.env.PORT || 3000; 

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('data/user-data.db');

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    address TEXT,
    contact_number TEXT
)`);




app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const query = "SELECT id, password FROM users WHERE email = ?";
    db.get(query, [email], async (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }

        if (!row) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, row.password); // Validate password
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        res.json({ userId: row.id }); // Send user ID back to the client
    });
});


// Route to handle sign-in
app.post('/sign-in', async (req, res) => {
    const { name, email, password, address, contact_number } = req.body;

    if (!name || !email || !password || !address || !contact_number) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if the user already exists by email
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const userId = uuidv4(); // Generate a unique UUID

        // Hash the password
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const query = `INSERT INTO users (id, name, email, password, address, contact_number) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [userId, name, email, hashedPassword, address, contact_number], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Failed to save user data' });
                }
                res.json({ message: 'User signed in successfully', userId });
            });
        } catch (error) {
            console.error('Error hashing password:', error);
            return res.status(500).json({ error: 'Failed to hash password' });
        }
    });
});



const saveOrderToCSV = async (orderDetails, userId) => {
    const filePath = path.resolve(
        __dirname,
        "../uploads/Orders.csv" // Update the path as needed
    );

    console.log("Absolute file path:", filePath);

    // Check if the file exists
    const fileExists = fs.existsSync(filePath);
    let csvContent = "";

    if (!fileExists) {
        console.log("File does not exist. Creating new file with headers.");
        // Add headers for a new file
        csvContent += "User ID,Item Name,Quantity,Price\n";
    }

    // Append order details to the CSV content
    orderDetails.forEach((order) => {
        const row = `${userId},${order.name},${order.quantity},${order.price}\n`;
        csvContent += row;
        console.log("Adding row:", row.trim());
    });

    try {
        // Write to the CSV file
        fs.appendFileSync(filePath, csvContent);
        console.log("Order details saved successfully to:", filePath);
    } catch (err) {
        console.error("Error writing to CSV file:", err);
    }
};


app.post("/save-order", async (req, res) => {
    const { userId, orderDetails } = req.body;

    console.log("Received User ID:", userId);
    console.log("Received Order Details:", orderDetails);

    if (!userId || !Array.isArray(orderDetails) || orderDetails.length === 0) {
        return res.status(400).json({ error: "Invalid order details or user ID" });
    }

    try {
        // Save the order details to the Excel file
        await saveOrderToCSV(orderDetails, userId);

        res.json({ message: "Order details saved successfully" });
    } catch (err) {
        console.error("Error saving order details:", err);
        res.status(500).json({ error: "Failed to save order details" });
    }
});




app.get("/generate-qr", async (req, res) => {
    const { amount } = req.query;

    if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: "Invalid or missing amount." });
    }

    try {
        const qrData = `upi://pay?pa=9359608283@ybl&pn=MadhuriLonchepvtltd&am=${amount}&cu=INR`;
        const qrCode = await QRCode.toBuffer(qrData); // Generate QR as a Buffer (image format)
        res.type("image/png").send(qrCode);
    } catch (err) {
        console.error("QR Code generation failed:", err);
        res.status(500).json({ error: "Failed to generate QR Code." });
    }
});




// Route to fetch all users
app.get('/users', (req, res) => {
    const query = `SELECT * FROM users`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching user data:', err);
            return res.status(500).json({ error: 'Failed to fetch user data' });
        }
        res.json(rows);
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
