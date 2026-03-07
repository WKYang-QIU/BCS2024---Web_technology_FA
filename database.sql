-- Campus Lost & Found Management System
-- Database Schema

CREATE DATABASE IF NOT EXISTS campus_lost_found;
USE campus_lost_found;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('Lost', 'Found') NOT NULL,
    location VARCHAR(255) NOT NULL,
    date_occurred DATE NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Claimed', 'Resolved') NOT NULL DEFAULT 'Active',
    image_path VARCHAR(500) NULL,
    user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_date (date_occurred),
    INDEX idx_created_at (created_at)
);