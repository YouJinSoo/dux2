const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

// 홈 페이지 라우트
router.get('/', (req, res) => {
  res.render('home', { title: 'Home' });
});

// 회원가입 라우트
router.post('/signup', [
    body('username').isLength({ min: 1 }),
    body('password').isLength({ min: 6 }),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    const query = 'SELECT * FROM dux_user_info WHERE user_id = ?';
    req.db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
        if (results.length > 0) {
            return res.json({ message: '아이디가 중복되었습니다.' });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = 'INSERT INTO dux_user_info (user_id, user_pw) VALUES (?, ?)';
            req.db.query(insertQuery, [username, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error:', err);
                    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
                }
                res.json({ message: '회원가입 성공' });
            });
        }
    });
});

// 로그인 라우트
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM dux_user_info WHERE user_id = ?';
    req.db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
        if (results.length > 0 && await bcrypt.compare(password, results[0].user_pw)) {
            res.json({ message: '로그인 성공' });
        } else {
            res.json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }
    });
});

// 정보 저장 라우트
router.post('/saveInfo', (req, res) => {
    const { title, detail, info } = req.body;

    const insertQuery = 'INSERT INTO registered_info (title, detail, info) VALUES (?, ?, ?)';
    req.db.query(insertQuery, [title, detail, info], (err, result) => {
        if (err) {
            console.error('Error inserting data into registered_info:', err);
            return res.status(500).json({ message: '정보 저장 중 오류가 발생했습니다.' });
        }
        res.json({ message: '정보 저장 성공' });
    });
});

// 등록된 정보 조회 라우트
router.get('/registered_info', (req, res) => {
    const query = 'SELECT title, detail, info FROM registered_info';
    req.db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching registered info:', err);
            return res.status(500).json({ message: 'Database query failed' });
        }
        res.json(results);
    });
});

module.exports = router;
