-- Lost & Found DB Schema --
-- Run this file to setup the database --

CREATE DATABASE IF NOT EXISTS campus_lost_found;
USE campus_lost_found;

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('Lost', 'Found') NOT NULL,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    contact VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Claimed', 'Resolved') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
