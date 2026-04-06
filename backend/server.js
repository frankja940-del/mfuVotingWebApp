const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======================= DB =======================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // pass of mysql user
    database: 'votingappdemo',
    port: 3306 // MySQL default port
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
app.get('/admin/stats', async (req, res) => {
    try {
        const [voters] = await db.promise().query("SELECT COUNT(*) AS total FROM voter");
        const [cands] = await db.promise().query("SELECT COUNT(*) AS total FROM candidate");
        const [votes] = await db.promise().query("SELECT COUNT(*) AS total FROM vote");

        const [lastCand] = await db.promise().query("SELECT candidate_id FROM candidate ORDER BY candidate_id DESC LIMIT 1");
        
        const latestId = lastCand.length > 0 ? lastCand[0].candidate_id : 'None';

        const totalVoters = voters[0].total;
        const totalVotes = votes[0].total;
        const percent = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(2) : "0.00";

        res.json({
            voters: totalVoters,
            candidates: cands[0].total,
            votes: totalVotes,
            turnout: percent,
            lastCandidateId: latestId 
        });
    } catch (err) {
        console.error("Stats Error:", err); // เพิ่ม log ไว้ดู Error ใน Terminal จะได้แก้บั๊กง่ายขึ้น
        res.status(500).json({ message: "Error fetching stats" });
    }
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
    
    // FIX: We pass empty strings ('') for password, name, and img to satisfy the database rules
    const sql = "INSERT INTO candidate (candidate_id, password, name, img, is_enabled) VALUES (?, '', '', '', 0)";

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



// ======================= candidate =======================
// Candidate Login
app.post('/candidate/login', async (req, res) => {
    const { username, password } = req.body; // username is the candidate_id

    try {
        const [rows] = await db.promise().query("SELECT * FROM candidate WHERE candidate_id = ?", [username]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid ID' });
        }

        const candidate = rows[0];

        // COMPARE plain text login password with hashed DB password
        const match = await bcrypt.compare(password, candidate.password);

        if (match) {
            // Success!
            res.json({
                message: 'Login successful',
                candidate: { username: candidate.candidate_id }
            });
        } else {
            res.status(401).json({ message: 'Incorrect password' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Login error' });
    }
});

// candidate register
app.post('/candidate/register', async (req, res) => {
    const { candidate_id, password } = req.body;

    if (!candidate_id || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }

    try {
        // 1. Check if ID exists and is not already registered
        const [rows] = await db.promise().query("SELECT password FROM candidate WHERE candidate_id = ?", [candidate_id]);

        if (rows.length === 0) return res.status(404).json({ message: 'ID not found' });
        if (rows[0].password) return res.status(400).json({ message: 'Already registered' });

        // 2. HASH THE PASSWORD
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Save the HASHED password, not the plain text
        await db.promise().query(
            "UPDATE candidate SET password = ?, is_enabled = 1 WHERE candidate_id = ?",
            [hashedPassword, candidate_id]
        );

        res.json({ message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});
//update candidate profile
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // ต้องสร้างโฟลเดอร์ชื่อ uploads ไว้ข้างๆ server.js ด้วยนะ
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cand-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- API Routes ---

// 1. ดึงข้อมูลโปรไฟล์ Candidate
app.get('/candidate/profile/:id', (req, res) => {
    const id = req.params.id;
    // Query ข้อมูลพร้อมนับคะแนนโหวตจากตาราง vote
    const sql = `
        SELECT c.name, c.policy, c.img, 
        (SELECT COUNT(*) FROM vote WHERE candidate_id = c.candidate_id) as votes 
        FROM candidate c 
        WHERE c.candidate_id = ?`;

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "Not found" });
        res.json(results[0]);
    });
});

// 2. อัปเดตข้อมูลโปรไฟล์ (รองรับทั้ง Text และ File)
app.post('/candidate/update-profile', upload.single('imgFile'), (req, res) => {
    const { candidate_id, name, policy } = req.body;
    let imgPath = req.body.img; // ใช้รูปเดิมถ้าไม่มีการโหลดใหม่

    if (req.file) {
        // ถ้ามีการอัปโหลดไฟล์ใหม่ ให้บันทึก URL ใหม่เข้าไป
        imgPath = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    const sql = "UPDATE candidate SET name = ?, policy = ?, img = ? WHERE candidate_id = ?";
    db.query(sql, [name, policy, imgPath, candidate_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Update failed", error: err });
        res.json({ success: true, imgUrl: imgPath });
    });
});

// ======================= voter =======================
// Voter Login
app.post('/voter/login', (req, res) => {
    const { citizen_id, laser_id } = req.body;

    // 1. เช็คว่ากรอกข้อมูลครบไหม
    if (!citizen_id || !laser_id) {
        return res.status(400).json({ message: 'Please fill all fields' });
    }

    const sql = "SELECT * FROM voter WHERE citizen_id = ? AND laser_id = ?";

    db.query(sql, [citizen_id, laser_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid Citizen ID or Laser ID' });
        }

        const user = results[0];

        // 2. เช็คว่าสิทธิ์การโหวตถูกเปิดอยู่หรือไม่ (is_enabled ต้องเป็น 1)
        if (user.is_enabled !== 1) {
            return res.status(403).json({ message: 'Your account is disabled. Please contact admin.' });
        }

        // 3. ส่งข้อมูลกลับ (ลบข้อมูลอ่อนไหวออก)
        const { laser_id: _, ...voterData } = user;
        res.json({
            message: 'Login success',
            voter: voterData
        });
    });
});

app.get('/voter/enabled', (req, res) => {
    const { citizen_id } = req.query;

    const sql = "SELECT is_enabled FROM voter WHERE citizen_id = ?";

    db.query(sql, [citizen_id], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Voter not found' });
        }
        res.json({ is_enabled: results[0].is_enabled });
    });
});

app.post('/voter/cast-vote', async (req, res) => {
    const { voter_id, candidate_id } = req.body;

    if (!voter_id || !candidate_id) {
        return res.status(400).json({ message: "Invalid request data." });
    }

    try {
        // 1. Check if the election system is actually OPEN
        const [settings] = await db.promise().query("SELECT voting_enabled FROM election_settings LIMIT 1");
        if (!settings[0] || settings[0].voting_enabled !== 1) {
            return res.status(403).json({ message: "Voting is currently closed." });
        }

        // 2. Check if this specific voter is enabled
        const [voter] = await db.promise().query("SELECT is_enabled FROM voter WHERE voter_id = ?", [voter_id]);
        if (!voter[0] || voter[0].is_enabled !== 1) {
            return res.status(403).json({ message: "Your account is not authorized to vote." });
        }

        // 3. Check if voter has already cast a vote (Double Voting protection)
        const [existing] = await db.promise().query("SELECT * FROM vote WHERE voter_id = ?", [voter_id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "You have already cast your vote." });
        }

        // 4. Insert the vote with the current timestamp
        const sql = "INSERT INTO vote (voter_id, candidate_id, voted_at) VALUES (?, ?, NOW())";
        await db.promise().query(sql, [voter_id, candidate_id]);
        
        res.json({ success: true, message: "Your vote has been recorded successfully!" });

    } catch (err) {
        console.error("Voting Error:", err);
        res.status(500).json({ message: "Database error during voting." });
    }
});

app.get('/voter/check-status/:voter_id', async (req, res) => {
    const { voter_id } = req.params;
    try {
        // JOIN the vote table with candidate table to get the name and ID
        const sql = `
            SELECT 
                v.voted_at, 
                v.candidate_id, 
                c.name AS candidate_name 
            FROM vote v
            JOIN candidate c ON v.candidate_id = c.candidate_id
            WHERE v.voter_id = ?
        `;
        
        const [rows] = await db.promise().query(sql, [voter_id]);
        
        if (rows.length > 0) {
            res.json({ 
                hasVoted: true, 
                voted_at: rows[0].voted_at,
                candidate_id: rows[0].candidate_id,
                candidate_name: rows[0].candidate_name 
            });
        } else {
            res.json({ hasVoted: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error checking status" });
    }
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