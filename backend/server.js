const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const path = require('path');
const cors = require('cors');

const saltRounds = 10;
const port = 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ======================= DB =======================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'votingappdemo'
});

db.connect(err => {
    if (err) return console.error('DB error:', err);
    console.log('Connected to DB');
});

// ======================= Routes =======================

//table
app.get('/data', (req, res) => {
    const sql = "SELECT * FROM admin"; //
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

// ======================= Admin =======================

// Login admin
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM admin WHERE username = ?";

    db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(401).json({ message: 'User not found' });

        // ใช้ bcrypt เทียบรหัสที่ส่งมา กับ รหัสที่ Hash ไว้ใน DB
        const isMatch = await bcrypt.compare(password, results[0].password);

        if (isMatch) {
            // ไม่ควรส่ง password กลับไปที่หน้าบ้าน (เพื่อความปลอดภัย)
            const { password, ...adminData } = results[0];
            return res.json({ message: 'Login success', admin: adminData });
        } else {
            return res.status(401).json({ message: 'Wrong password' });
        }
    });
});

// Admin Dashboard Stats
app.get('/admin/stats', (req, res) => {
    const sqlVoters = "SELECT COUNT(*) AS totalVoters FROM voter";
    const sqlCands = "SELECT COUNT(*) AS totalCands FROM candidate";
    const sqlVotes = "SELECT COUNT(*) AS totalVotes FROM vote";
    // ดึง ID ล่าสุด
    const sqlLastId = "SELECT MAX(candidate_id) AS lastId FROM candidate";

    db.query(sqlVoters, (err, resVoters) => {
        db.query(sqlCands, (err, resCands) => {
            db.query(sqlVotes, (err, resVotes) => {
                db.query(sqlLastId, (err, resLast) => {
                    if (err) return res.status(500).json(err);

                    const totalVoters = resVoters[0].totalVoters;
                    const totalCands = resCands[0].totalCands;
                    const totalVotes = resVotes[0].totalVotes;
                    const lastId = resLast[0].lastId || "None"; 
                    
                    const percent = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(2) : 0;

                    res.json({
                        voters: totalVoters,
                        candidates: totalCands,
                        votes: totalVotes,
                        turnout: percent,
                        lastCandidateId: lastId 
                    });
                });
            });
        });
    });
});

// Register New Voter
app.post('/admin/add-voter', (req, res) => {
    const { citizen_id, laser_id } = req.body;
    const sql = "INSERT INTO voter (citizen_id, laser_id, is_enabled) VALUES (?, ?, 1)";

    db.query(sql, [citizen_id, laser_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Voter registered successfully!" });
    });
});

// Register New Candidate Placeholder
app.post('/admin/add-candidate', (req, res) => {
    const { candidate_id } = req.body; 
    const sql = "INSERT INTO candidate (candidate_id, is_enabled) VALUES (?, 1)";

    db.query(sql, [candidate_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Candidate created successfully!" });
    });
});


// ======================= server test =======================
app.get('/data', (req, res) => {
    const sql = "SELECT * FROM admin";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json(result);
    });
});

// ======================= Start server =======================
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));