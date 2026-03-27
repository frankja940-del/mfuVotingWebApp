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
app.use(express.urlencoded({ extended: true }))
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

// Danger Zone API

//(Reset Votes)
app.post('/admin/emergency/reset-votes', (req, res) => {
    const sql = "DELETE FROM vote";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "All votes have been cleared!" });
    });
});

//(Clear Voters)
app.post('/admin/emergency/clear-voters', (req, res) => {
    const sql = "DELETE FROM voter";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "All voters have been removed!" });
    });
});

// (Clear Candidates)
app.post('/admin/emergency/clear-candidates', (req, res) => {
    const sql = "DELETE FROM candidate";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "All candidates have been removed!" });
    });
});

// (Factory Reset)
app.post('/admin/emergency/factory-reset', (req, res) => {
    db.query("DELETE FROM vote", (err) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to clear votes" });

        db.query("DELETE FROM candidate", (err) => {
            if (err) return res.status(500).json({ success: false, message: "Failed to clear candidates" });

            db.query("DELETE FROM voter", (err) => {
                if (err) return res.status(500).json({ success: false, message: "Failed to clear voters" });

                res.json({ success: true, message: "System factory reset successful!" });
            });
        });
    });
});

// global toggle system

app.post('/admin/toggle-system', (req, res) => {

    const getSql = "SELECT voting_enabled FROM election_settings LIMIT 1";
    db.query(getSql, (err, result) => {
        if (err) return res.status(500).json(err);

        if (result.length > 0) {
            const newStatus = result[0].voting_enabled == 1 ? 0 : 1;

            const updateSql = "UPDATE election_settings SET voting_enabled = ?";

            db.query(updateSql, [newStatus], (err) => {
                if (err) return res.status(500).json(err);

                console.log("System toggled to:", newStatus); // ไว้เช็คใน Terminal
                res.json({ success: true, newStatus: newStatus });
            });
        } else {

            const insertSql = "INSERT INTO election_settings (voting_enabled) VALUES (1)";
            db.query(insertSql, (err) => {
                if (err) return res.status(500).json(err);
                res.json({ success: true, newStatus: 1 });
            });
        }
    });
});

// voter acsess control

// Voter display
app.get('/admin/voters', (req, res) => {
    const sql = "SELECT * FROM voter ORDER BY voter_id DESC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// voter toggle
app.post('/admin/voter/toggle-status', (req, res) => {
    const { voter_id, current_status } = req.body;
    const newStatus = current_status == 1 ? 0 : 1;
    const sql = "UPDATE voter SET is_enabled = ? WHERE voter_id = ?";
    db.query(sql, [newStatus, voter_id], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, newStatus: newStatus });
    });
});

// candidate acsess control

// Candidate display and toggle
app.get('/admin/candidates', (req, res) => {
    const sql = "SELECT * FROM candidate ORDER BY CAST(candidate_id AS UNSIGNED) ASC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post('/admin/candidate/toggle-status', (req, res) => {
    const { candidate_id, current_status } = req.body;
    const newStatus = current_status == 1 ? 0 : 1;
    const sql = "UPDATE candidate SET is_enabled = ? WHERE candidate_id = ?";
    db.query(sql, [newStatus, candidate_id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, newStatus: newStatus });
    });
});

//result display
app.get('/admin/results', (req, res) => {
    const sql = `
        SELECT 
            c.candidate_id, 
            c.name, 
            c.is_enabled, 
            COUNT(v.vote_id) AS vote_count
        FROM candidate c
        LEFT JOIN vote v ON c.candidate_id = v.candidate_id
        WHERE c.is_enabled = 1 
        GROUP BY c.candidate_id, c.name, c.is_enabled 
        ORDER BY vote_count DESC;
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

app.get('/admin/system-status', (req, res) => {
    const sql = "SELECT voting_enabled FROM election_settings LIMIT 1";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        
        if (result.length > 0) {
            res.json({ voting_enabled: result[0].voting_enabled });
        } else {
            res.json({ voting_enabled: 0 }); 
        }
    });
});


// ======================= Voter =======================

// Voter Login
app.post('/voter/login', (req, res) => {
    console.log("Login Request received:", req.body);

    const { citizen_id, laser_id } = req.body;

    if (!citizen_id || !laser_id) {
        return res.status(400).json({ message: 'fill all fields' });
    }

    const sql = "SELECT * FROM voter WHERE citizen_id = ? AND laser_id = ? AND is_enabled = 1";

    db.query(sql, [citizen_id, laser_id], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้ หรือข้อมูลไม่ถูกต้อง' });
        }

        const { password, laser_id: _, ...voterData } = results[0];

        res.json({
            message: 'Login success',
            voter: voterData
        });
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