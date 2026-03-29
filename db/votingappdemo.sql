-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 29, 2026 at 03:17 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `votingappdemo`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(97) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`admin_id`, `username`, `password`, `created_at`) VALUES
(1, 'admin', '$2b$10$MpA/SefSc4bRDl5nmf2uwu8fYprldOR1Jr2r7O9ZZTx7qRZl2e7gm', '2026-03-26 05:50:57');

-- --------------------------------------------------------

--
-- Table structure for table `candidate`
--

CREATE TABLE `candidate` (
  `candidate_id` int(11) NOT NULL,
  `password` varchar(97) NOT NULL,
  `name` varchar(100) NOT NULL,
  `policy` text DEFAULT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `img` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `candidate`
--

INSERT INTO `candidate` (`candidate_id`, `password`, `name`, `policy`, `is_enabled`, `created_at`, `img`) VALUES
(1, '$2b$10$MecVfnpjisYUjrehU3OrDuLkYwrWbR2097Spj2p1PEQkuoui6gVNe', 'lemondogs', 'better Campus/better major/better if u choose another major', 1, '2026-03-26 10:39:34', 'http://localhost:3000/uploads/cand-1774651530438-736130043.png'),
(2, '$2b$10$GhY4Yym9t1gQuom5jZtAOOq9Os4c5alI9XLL5TSvUmYEFjxH0IPIS', 'John Smith', 'Digital Transformation for Campus Life', 1, '2026-03-26 10:32:44', 'john.jpg'),
(3, '$2b$10$/jr1eAOCHHk1newE9r9VDOsvQ8PW/6KjH5FXsVAjSCbv8U3VCPTcu', 'Emily Watson', 'Green University & Zero Waste Initiative', 1, '2026-03-26 10:32:44', 'emily.jpg'),
(4, '$2b$10$wcG9iHUf3.s/LxUGk9oKv.2TfRL6nSzsuuquPBYXfGlUDHVnWhfe6', 'Michael Chen', '24/7 Library Access & Mental Health Support', 1, '2026-03-26 10:32:44', 'michael.jpg'),
(5, '$2b$10$GYThF4YzTrxE5vPs63.5eeUsAqjCSF0dJW0fNEKe.zB0rNlysSLwW', '', NULL, 1, '2026-03-28 04:12:22', ''),
(6, '$2b$10$Yjnx0nfu1ryAgvLfjLY4aOv6eWYhnLl16MiZSgBsZLH2eDXKch1Ai', '', NULL, 1, '2026-03-28 04:13:48', '');

-- --------------------------------------------------------

--
-- Table structure for table `election_settings`
--

CREATE TABLE `election_settings` (
  `election_settings_id` int(11) NOT NULL,
  `voting_enabled` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `election_settings`
--

INSERT INTO `election_settings` (`election_settings_id`, `voting_enabled`, `created_at`, `updated_at`) VALUES
(1, 0, '2026-03-26 11:04:11', '2026-03-28 15:26:06');

-- --------------------------------------------------------

--
-- Table structure for table `vote`
--

CREATE TABLE `vote` (
  `vote_id` int(11) NOT NULL,
  `voter_id` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `voted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vote`
--

INSERT INTO `vote` (`vote_id`, `voter_id`, `candidate_id`, `voted_at`) VALUES
(9, 1, 1, '2026-03-26 10:40:00'),
(10, 2, 2, '2026-03-26 10:40:00'),
(11, 3, 1, '2026-03-26 10:40:00'),
(12, 4, 3, '2026-03-26 10:40:00');

-- --------------------------------------------------------

--
-- Table structure for table `voter`
--

CREATE TABLE `voter` (
  `voter_id` int(11) NOT NULL,
  `citizen_id` varchar(20) NOT NULL,
  `laser_id` varchar(50) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voter`
--

INSERT INTO `voter` (`voter_id`, `citizen_id`, `laser_id`, `is_enabled`, `created_at`) VALUES
(1, '6531501001', 'JT9-1111111-11', 1, '2026-03-26 10:32:50'),
(2, '6531501002', 'JT9-2222222-22', 1, '2026-03-26 10:32:50'),
(3, '6531501003', 'JT9-3333333-33', 1, '2026-03-26 10:32:50'),
(4, '6531501004', 'JT9-4444444-44', 1, '2026-03-26 10:32:50'),
(5, '6531501005', 'JT9-5555555-55', 1, '2026-03-26 10:32:50'),
(6, '6531501006', 'JT9-6666666-66', 1, '2026-03-26 10:32:50'),
(7, '6531501007', 'JT9-7777777-77', 1, '2026-03-26 10:32:50'),
(8, '6531501008', 'JT9-8888888-88', 1, '2026-03-26 10:32:50'),
(9, '6531501009', 'JT9-9999999-99', 1, '2026-03-26 10:32:50'),
(10, '6531501010', 'JT9-0000000-00', 1, '2026-03-26 10:32:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`admin_id`);

--
-- Indexes for table `candidate`
--
ALTER TABLE `candidate`
  ADD PRIMARY KEY (`candidate_id`);

--
-- Indexes for table `election_settings`
--
ALTER TABLE `election_settings`
  ADD PRIMARY KEY (`election_settings_id`);

--
-- Indexes for table `vote`
--
ALTER TABLE `vote`
  ADD PRIMARY KEY (`vote_id`),
  ADD UNIQUE KEY `voter_id` (`voter_id`),
  ADD UNIQUE KEY `voter_id_2` (`voter_id`),
  ADD KEY `candidate_id` (`candidate_id`);

--
-- Indexes for table `voter`
--
ALTER TABLE `voter`
  ADD PRIMARY KEY (`voter_id`),
  ADD UNIQUE KEY `citizen_id` (`citizen_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `candidate`
--
ALTER TABLE `candidate`
  MODIFY `candidate_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `election_settings`
--
ALTER TABLE `election_settings`
  MODIFY `election_settings_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `vote`
--
ALTER TABLE `vote`
  MODIFY `vote_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `voter`
--
ALTER TABLE `voter`
  MODIFY `voter_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `vote`
--
ALTER TABLE `vote`
  ADD CONSTRAINT `vote_ibfk_1` FOREIGN KEY (`voter_id`) REFERENCES `voter` (`voter_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vote_ibfk_2` FOREIGN KEY (`candidate_id`) REFERENCES `candidate` (`candidate_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
