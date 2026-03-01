Drop DATABASE IF EXISTS dog_adoption_db;
CREATE DATABASE IF NOT EXISTS dog_adoption_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE dog_adoption_db;

CREATE TABLE users (
	UserId INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,    
    UserEmail VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    citizen_id VARCHAR(13) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    UserRole ENUM('USER','STAFF','ADMIN','SPONSOR') NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dogs (
    DogId INT AUTO_INCREMENT PRIMARY KEY,
    DogName VARCHAR(100) NOT NULL,
    Age INT DEFAULT NULL,
    breed VARCHAR(100),
    gender ENUM('MALE','FEMALE','UNKNOWN') DEFAULT 'UNKNOWN',
    color VARCHAR(100),
    medical_profile TEXT,
    treatment_process TEXT,
    training_status TEXT,
    image_url VARCHAR(500),
    DogStatus ENUM('AVAILABLE','PENDING','ADOPTED','IN_TREATMENT') DEFAULT 'AVAILABLE',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(UserId)
);

CREATE TABLE favorites (
    UserId INT NOT NULL,
    DogId INT NOT NULL,
    UNIQUE(UserId, DogId),
    FOREIGN KEY (UserId) REFERENCES users(UserId) ON DELETE CASCADE,
    FOREIGN KEY (DogId) REFERENCES dogs(DogId) ON DELETE CASCADE
);

CREATE TABLE adoption_requests (
    AdoptionReqNo INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    DogId INT NOT NULL,
    ReqStatus ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    verification_status ENUM('PENDING','PASSED','FAILED') DEFAULT 'PENDING',
    rejection_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES users(UserId),
    FOREIGN KEY (DogId) REFERENCES dogs(DogId)
);

CREATE TABLE adoption_request_details (
    AdoptionReqNo INT PRIMARY KEY,
    adopter_address TEXT NULL,
    living_type ENUM('house','condo','apartment','townhouse') NULL,
    adoption_reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AdoptionReqNo) REFERENCES adoption_requests(AdoptionReqNo) ON DELETE CASCADE
);


CREATE TABLE delivery_schedules (
    DeliveryNo INT AUTO_INCREMENT PRIMARY KEY,
    AdoptionReqNo INT NOT NULL,
    deliveryDate DATE NOT NULL,
    DeliveryStatus ENUM('SCHEDULED','COMPLETED') DEFAULT 'SCHEDULED',
    StaffConfirmed TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (AdoptionReqNo) REFERENCES adoption_requests(AdoptionReqNo)
);

CREATE TABLE monthly_followups (
    FollowupNo INT AUTO_INCREMENT PRIMARY KEY,
    AdoptionReqNo INT NOT NULL,
    FollowupMonth INT NOT NULL,
    note TEXT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    check_date DATE NOT NULL,
    UserRole ENUM('STAFF','USER') NOT NULL DEFAULT 'STAFF',
    FOREIGN KEY (AdoptionReqNo) REFERENCES adoption_requests(AdoptionReqNo)
);


CREATE TABLE sponsors (
    SponsorId INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    donation_amount DECIMAL(10,2) NOT NULL,
    banner_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES users(UserId)
);


CREATE TABLE criminal_records (
    citizen_id VARCHAR(20) PRIMARY KEY,
    has_criminal_record BOOLEAN NOT NULL
);

CREATE TABLE blacklist_records (
    citizen_id VARCHAR(20) PRIMARY KEY,
    reason TEXT NOT NULL
);

CREATE TABLE citizen_records (
    citizen_id VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(150),
    birth_date DATE
);

CREATE INDEX idx_dog_status ON dogs(DogStatus);
CREATE INDEX idx_adoption_status ON adoption_requests(ReqStatus);
CREATE INDEX idx_user_role ON users(UserRole);

INSERT INTO users (FirstName, LastName, UserEmail, password_hash, citizen_id, phone, address, UserRole, is_verified) VALUES
('ธนกฤต','ศรีสุข','thanakrit@gmail.com','$2b$10$hash1','1103705566778','0851111111','ขอนแก่น','USER',TRUE),
('ปวีณา','ทองดี','paweena@gmail.com','$2b$10$hash2','1103706677889','0862222222','เชียงใหม่','USER',TRUE),
('เอกชัย','รุ่งเรือง','ekachai@gmail.com','$2b$10$hash3','1103707788990','0873333333','สมุทรปราการ','USER',FALSE),
('กานต์','ใจดี','kan@gmail.com','$2b$10$hash4','1103701111222','0880000001','กรุงเทพ','USER',TRUE),
('วรพล','ชัยดี','worapon@gmail.com','$2b$10$hash5','1103703333444','0890000002','โคราช','USER',TRUE),

('มาลี','บุญมาก','malee.staff@gmail.com','$2b$10$hash6','1103708899001','0884444444','สำนักงานเชียงใหม่','STAFF',TRUE),
('สมชาย','กิจรุ่ง','somchai.staff@gmail.com','$2b$10$hash7','1103709999001','0885555555','สำนักงานกรุงเทพ','STAFF',TRUE),

('ผู้ดูแล','ระบบ','admin@gmail.com','$2b$10$hash8','1103701234567','0801111222','สำนักงานใหญ่','ADMIN',TRUE),

('มูลนิธิเพื่อนสี่ขา','ช่วยเหลือสัตว์','sponsor1@gmail.com','$2b$10$hash9','1103709900112','0895555555','พระราม 2','SPONSOR',TRUE),
('ใจบุญ','บริจาค','sponsor2@gmail.com','$2b$10$hash10','1103708800111','0896666666','นนทบุรี','SPONSOR',TRUE);

INSERT INTO dogs (DogName, Age, breed, gender, color, medical_profile, treatment_process, training_status, image_url, DogStatus, created_by) VALUES
('เจ้าขาว',3,'ไทยพื้นบ้าน','MALE','ขาว','แข็งแรง','ทำหมันแล้ว','ผ่านการฝึกพื้นฐาน','https://png.pngtree.com/thumb_back/fh260/background/20220718/pngtree-thai-dog-portrait-design-dogs-photo-image_26813798.jpg','AVAILABLE',6),
('เจ้าจุด',2,'ดัลเมเชียน','FEMALE','ขาว-ดำ','แพ้อาหาร','ควบคุมอาหาร','ผ่านการฝึกขั้นต้น','https://s359.kapook.com/r/600/auto/pagebuilder/cc347dd2-2885-469c-b421-3cafc6e221de.jpg','AVAILABLE',6),
('เจ้าบ๊อบ',1,'ชิวาวา','FEMALE','น้ำตาล','สุขภาพดี','ฉีดวัคซีนครบ','ยังไม่ผ่านการฝึก','https://tse4.mm.bing.net/th/id/OIP.yhY7cVwx-h0W5P4obGxNYgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3','AVAILABLE',7),
('เจ้าลัคกี้',4,'ไซบีเรียน','FEMALE','เทา-ขาว','สุขภาพดี','ทำหมันแล้ว','ผ่านการฝึกขั้นสูง','https://i.pinimg.com/736x/87/88/27/87882708c2b6dab21d15afa21582ea90.jpg','ADOPTED',7),
('เจ้าส้ม',2,'ไทยพื้นบ้าน','FEMALE','ส้ม','เคยขาหัก','รักษาหายแล้ว','ยังไม่ผ่านการฝึก','https://tse1.mm.bing.net/th/id/OIP.Xff-vCC3dmES-fuQjwiX9wHaE8?w=1000&h=667&rs=1&pid=ImgDetMain&o=7&rm=3','PENDING',6),
('เจ้าดำ',5,'ลาบราดอร์','MALE','ดำ','แข็งแรง','ทำหมันแล้ว','ผ่านการฝึก','https://f.ptcdn.info/128/008/000/1375858257-1004675676-o.jpg','AVAILABLE',7),
('เจ้าทอง',3,'บางแก้ว','MALE','น้ำตาล','สุขภาพดี','วัคซีนครบ','ผ่านการฝึก','https://pbs.twimg.com/media/DfZdRUOUwAEYw-g.jpg','AVAILABLE',6),
('เจ้าฟ้า',2,'พุดเดิ้ล','FEMALE','ขาว','ผิวหนังอ่อนแอ','รักษาแล้ว','ผ่านการฝึก','https://preview.redd.it/when-i-first-adopted-my-toy-poodle-at-6-months-old-vs-now-v0-zh3bnuffnmyb1.jpg?width=640&crop=smart&auto=webp&s=e645b4a9ad3df8e48253f0b4b3286d435d90751f','AVAILABLE',7),
('เจ้ามุก',1,'โกลเด้น','FEMALE','ทอง','แข็งแรง','ทำหมันแล้ว','ขั้นสูง','https://cdn.ennxo.com/uploads/products/640/40340f2504904966b8dd9d072b6f6e74.jpg','PENDING',6),
('เจ้าขุน',6,'ร็อตไวเลอร์','MALE','ดำ-น้ำตาล','สุขภาพดี','ทำหมันแล้ว','ขั้นต้น','https://upic.me/i/t0/14137418-4.jpg','AVAILABLE',7);



INSERT INTO favorites (UserId, DogId) VALUES
(1,1),(1,2),
(2,3),(2,4),
(3,5),
(4,6),
(5,7);

INSERT INTO adoption_requests (UserId, DogId, ReqStatus, verification_status, rejection_reason) VALUES
(1,4,'APPROVED','PASSED',NULL),
(2,5,'REJECTED','FAILED',NULL),
(3,2,'PENDING','PENDING',NULL),
(4,9,'APPROVED','PASSED',NULL),
(5,1,'PENDING','PASSED',NULL);

INSERT INTO adoption_request_details (AdoptionReqNo, adopter_address, living_type, adoption_reason) VALUES
(1,'ขอนแก่น','house','มีพื้นที่บ้านกว้างและมีเวลาพาน้องเดินทุกวัน'),
(2,'เชียงใหม่','condo','ต้องการรับเลี้ยงสุนัขตัวเล็กในคอนโดที่อนุญาตสัตว์เลี้ยง'),
(3,'สมุทรปราการ','apartment','อยากดูแลน้องสุนัขและพร้อมดูแลเรื่องวัคซีน'),
(4,'กรุงเทพ','townhouse','ครอบครัวพร้อมช่วยกันดูแลและมีรั้วบ้านปลอดภัย'),
(5,'โคราช','house','มีประสบการณ์เลี้ยงสุนัขมาก่อนและมีพื้นที่วิ่งเล่น');

INSERT INTO delivery_schedules (AdoptionReqNo, deliveryDate, DeliveryStatus, StaffConfirmed) VALUES
(1,'2026-03-20','SCHEDULED',0),
(4,'2026-02-10','COMPLETED',1);

INSERT INTO monthly_followups (AdoptionReqNo, FollowupMonth, note, photo_url, check_date, UserRole) VALUES
(4,1,'ปรับตัวได้ดี','/followups/3.jpg','2026-03-01','STAFF');

INSERT INTO sponsors (UserId, donation_amount, banner_url) VALUES
(9,75000.00,'https://tkga.org/wp-content/uploads/2025/11/Web-banner-970x200-1.jpg'),
(10,120000.00,'/banners/jaiboon.jpg');

INSERT INTO criminal_records (citizen_id, has_criminal_record) VALUES
('1103705566778',FALSE),
('1103706677889',FALSE),
('1103707788990',TRUE),
('1103708888888',TRUE);

INSERT INTO blacklist_records (citizen_id, reason) VALUES
('1103707788990','ทารุณกรรมสัตว์'),
('1103709999999','ละเมิดสัญญาการดูแลสัตว์');

INSERT INTO citizen_records(citizen_id, full_name, birth_date) VALUES
('1103705566778','ธนกฤต ศรีสุข','1992-04-12'),
('1103706677889','ปวีณา ทองดี','1998-07-19'),
('1103707788990','เอกชัย รุ่งเรือง','1987-11-03'),
('1103708899001','มาลี บุญมาก','1983-09-22');
