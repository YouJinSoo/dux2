// 1. 필요한 모듈 가져오기 (Import necessary modules)
require('dotenv').config(); // .env 파일에서 환경 변수 로드 (Load environment variables from .env file)
const express = require('express'); // Express 모듈 가져오기 (Import Express module)
const path = require('path'); // 경로 관련 모듈 (Module for handling file and directory paths)
const mysql = require('mysql2'); // MySQL 모듈 (Import MySQL module)
const indexRouter = require('./routes/index'); // 라우터 모듈 (Import router module)

const app = express(); // Express 애플리케이션 생성 (Create Express application)

// 2. MySQL 데이터베이스 연결 설정 (Configure MySQL database connection)
// MySQL 데이터베이스 연결 설정 (Configure MySQL database connection)
const db = mysql.createConnection({
    host: process.env.DB_HOST, // 환경 변수에서 호스트 가져오기 (Get host from environment variables)
    user: process.env.DB_USER, // 환경 변수에서 사용자 이름 가져오기 (Get username from environment variables)
    password: process.env.DB_PASSWORD, // 환경 변수에서 비밀번호 가져오기 (Get password from environment variables)
    database: process.env.DB_NAME // 환경 변수에서 데이터베이스 이름 가져오기 (Get database name from environment variables)
});

// 3. 데이터베이스 연결 및 테이블 생성 (Connect to the database and create tables)
const connectToDatabase = () => {
    db.connect((err) => {
        if (err) {
            console.error('데이터베이스 연결 실패:', err);
            process.exit(1); // 서버 종료
        }
        console.log('데이터베이스에 연결되었습니다.');

        // 테이블 생성 (Create tables)
        createTables();
    });
};

const createTables = () => {
    const createUserTableQuery = `
        CREATE TABLE IF NOT EXISTS dux_user_info (
            user_id VARCHAR(100) NOT NULL,
            user_pw VARCHAR(100) NOT NULL,
            PRIMARY KEY (user_id)
        );
    `;

    const createRegisteredInfoTableQuery = `
        CREATE TABLE IF NOT EXISTS registered_info (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(999),
            detail VARCHAR(999),
            info VARCHAR(999)
        );
    `;

    // 테이블 생성 (Create tables)
    db.query(createUserTableQuery, (err, results) => {
        if (err) {
            console.error('dux_user_info 테이블 생성 실패:', err);
            return;
        }
        console.log('dux_user_info 테이블이 성공적으로 생성되었습니다:', results);
    });

    db.query(createRegisteredInfoTableQuery, (err, results) => {
        if (err) {
            console.error('registered_info 테이블 생성 실패:', err);
            return;
        }
        console.log('registered_info 테이블이 성공적으로 생성되었습니다:', results);
    });
};

connectToDatabase(); // 데이터베이스 연결 및 테이블 생성 호출

// 4. Body-parser 설정 (Configure body-parser)
app.use(express.json()); // JSON 요청 파싱 (Parse JSON requests)
app.use(express.urlencoded({ extended: true })); // URL-encoded 요청 파싱 (Parse URL-encoded requests)

// 5. 뷰 엔진 설정 (Set view engine)
app.set('views', path.join(__dirname, 'views')); // 뷰 파일 경로 설정 (Set view files path)
app.set('view engine', 'ejs'); // 뷰 엔진으로 EJS 사용 (Use EJS as view engine)

// 6. 정적 파일 제공 (Serve static files)
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 경로 설정 (Set static files path)

// 7. MySQL 데이터베이스 객체를 모든 요청에 추가 (Add MySQL database object to all requests)
app.use((req, res, next) => {
    req.db = db; // 요청 객체에 db 추가 (Add db to request object)
    next(); // 다음 미들웨어로 이동 (Move to the next middleware)
});

// 8. 라우트 설정 (Configure routes)
app.use('/', indexRouter); // 기본 라우트 설정 (Set default route)

// 9. 지도 페이지 라우트 (Map page route)
app.get('/map', (req, res) => {
    res.render('Map', { title: 'Map' }); // Map.ejs 파일 렌더링 (Render Map.ejs file)
});

// 10. Naver API 라우트 (Naver API route)
app.get('/search', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const query = req.query.query;

        console.log(`Received search query: ${query}`);

        const response = await fetch(`https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10`, {
            headers: {
                'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching data:', errorData);
            return res.status(response.status).json({ message: errorData.message || 'Internal Server Error' });
        }

        const data = await response.json();
        console.log('Response data:', data);
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// 11. 서버 시작 (Start the server)
const PORT = process.env.PORT || 4897; // 포트 설정 (Set port)
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`); // 서버 시작 메시지 (Server start message)
});

module.exports = app; // 모듈 내보내기 (Export module)
