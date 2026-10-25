-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: constellation_hub
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alembic_version`
--

DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alembic_version`
--

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
INSERT INTO `alembic_version` VALUES ('001_initial');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `constellations`
--

DROP TABLE IF EXISTS `constellations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `constellations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `operator` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orbit_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orbit_regime` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `num_planes` int DEFAULT NULL,
  `sats_per_plane` int DEFAULT NULL,
  `altitude_km` double DEFAULT NULL,
  `inclination_deg` double DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_constellations_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `constellations`
--

LOCK TABLES `constellations` WRITE;
/*!40000 ALTER TABLE `constellations` DISABLE KEYS */;
INSERT INTO `constellations` VALUES (1,'Demo LEO Constellation','Demonstration constellation for Constellation Hub showcase',NULL,'LEO','LEO',1,10,550,53,'{\"source\": \"demo_seed\", \"version\": \"1.0\"}','2026-10-25 19:39:56.597991','2026-10-25 19:39:56.597991');
/*!40000 ALTER TABLE `constellations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_queues`
--

DROP TABLE IF EXISTS `data_queues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_queues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `satellite_id` int NOT NULL,
  `critical_volume_mb` double NOT NULL DEFAULT '0',
  `high_volume_mb` double NOT NULL DEFAULT '0',
  `medium_volume_mb` double NOT NULL DEFAULT '0',
  `low_volume_mb` double NOT NULL DEFAULT '0',
  `total_volume_mb` double NOT NULL DEFAULT '0',
  `customer_allocations` json DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_data_queues_satellite_id` (`satellite_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_queues`
--

LOCK TABLES `data_queues` WRITE;
/*!40000 ALTER TABLE `data_queues` DISABLE KEYS */;
INSERT INTO `data_queues` VALUES (1,1,50,200,500,1000,1750,'{\"customer_batch\": 1500.0, \"mission_payload\": 250.0}','2026-10-25 19:39:57.716051'),(2,2,70,250,600,1150,2070,'{\"customer_batch\": 1750.0, \"mission_payload\": 320.0}','2026-10-25 19:39:57.716930'),(3,3,90,300,700,1300,2390,'{\"customer_batch\": 2000.0, \"mission_payload\": 390.0}','2026-10-25 19:39:57.717640'),(4,4,110,350,800,1450,2710,'{\"customer_batch\": 2250.0, \"mission_payload\": 460.0}','2026-10-25 19:39:57.718623'),(5,5,130,400,900,1600,3030,'{\"customer_batch\": 2500.0, \"mission_payload\": 530.0}','2026-10-25 19:39:57.719369'),(6,6,150,450,1000,1750,3350,'{\"customer_batch\": 2750.0, \"mission_payload\": 600.0}','2026-10-25 19:39:57.720055'),(7,7,170,500,1100,1900,3670,'{\"customer_batch\": 3000.0, \"mission_payload\": 670.0}','2026-10-25 19:39:57.720846'),(8,8,190,550,1200,2050,3990,'{\"customer_batch\": 3250.0, \"mission_payload\": 740.0}','2026-10-25 19:39:57.721506'),(9,9,210,600,1300,2200,4310,'{\"customer_batch\": 3500.0, \"mission_payload\": 810.0}','2026-10-25 19:39:57.722143'),(10,10,230,650,1400,2350,4630,'{\"customer_batch\": 3750.0, \"mission_payload\": 880.0}','2026-10-25 19:39:57.722842');
/*!40000 ALTER TABLE `data_queues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ground_stations`
--

DROP TABLE IF EXISTS `ground_stations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ground_stations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `elevation_m` double NOT NULL DEFAULT '0',
  `min_elevation_deg` double NOT NULL DEFAULT '10',
  `capabilities` json DEFAULT NULL,
  `health_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nominal',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operational',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `cost_per_minute` double NOT NULL DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ground_stations_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ground_stations`
--

LOCK TABLES `ground_stations` WRITE;
/*!40000 ALTER TABLE `ground_stations` DISABLE KEYS */;
INSERT INTO `ground_stations` VALUES (1,'AWS Ground Station - US West',37.7749,-122.4194,50,10,'[\"S-band\", \"X-band\"]','nominal','operational',1,3,'{\"operator\": \"Constellation Network Partner\"}','2026-10-25 19:39:56.669416','2026-10-25 19:39:56.669416'),(2,'ESA Ground Station - Europe',52.2985,5.1719,100,10,'[\"S-band\", \"X-band\", \"Ka-band\"]','nominal','operational',1,4.5,'{\"operator\": \"Constellation Network Partner\"}','2026-10-25 19:39:56.673498','2026-10-25 19:39:56.673498'),(3,'JAXA Ground Station - Asia',35.6762,139.6503,20,10,'[\"S-band\", \"X-band\"]','nominal','operational',1,3.5,'{\"operator\": \"Constellation Network Partner\"}','2026-10-25 19:39:56.679591','2026-10-25 19:39:56.679591'),(4,'Svalbard (SvalSat) - Norway',78.23,15.41,464,5,'[\"S-band\", \"X-band\", \"Ka-band\", \"Optical\"]','nominal','operational',1,5,'{\"operator\": \"Constellation Network Partner\"}','2026-10-25 19:39:56.685086','2026-10-25 19:39:56.685086'),(5,'Wallops Island - NASA US',37.94,-75.47,3,10,'[\"UHF\", \"S-band\", \"X-band\"]','nominal','operational',1,2.5,'{\"operator\": \"Constellation Network Partner\"}','2026-10-25 19:39:56.688091','2026-10-25 19:39:56.688091'),(6,'Canberra DSN - Australia',-35.4,148.98,680,10,'[\"S-band\", \"X-band\", \"Ka-band\"]','nominal','operational',1,6,'{\"operator\": \"Constellation Network Partner\"}','2026-10-25 19:39:56.690801','2026-10-25 19:39:56.690801');
/*!40000 ALTER TABLE `ground_stations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `links`
--

DROP TABLE IF EXISTS `links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `link_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_id` int NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` int NOT NULL,
  `latency_ms` double DEFAULT NULL,
  `bandwidth_mbps` double DEFAULT NULL,
  `cost` double DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `ix_links_source` (`source_type`,`source_id`),
  KEY `ix_links_target` (`target_type`,`target_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `links`
--

LOCK TABLES `links` WRITE;
/*!40000 ALTER TABLE `links` DISABLE KEYS */;
INSERT INTO `links` VALUES (1,'inter_satellite','satellite',1,'satellite',2,5.4,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.676294','2026-10-25 19:39:57.676294'),(2,'inter_satellite','satellite',2,'satellite',3,5.7,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.677164','2026-10-25 19:39:57.677164'),(3,'inter_satellite','satellite',3,'satellite',4,6,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.678072','2026-10-25 19:39:57.678072'),(4,'inter_satellite','satellite',4,'satellite',5,6.300000000000001,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.679136','2026-10-25 19:39:57.679136'),(5,'inter_satellite','satellite',5,'satellite',6,6.6000000000000005,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.680434','2026-10-25 19:39:57.680434'),(6,'inter_satellite','satellite',6,'satellite',7,6.9,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.681213','2026-10-25 19:39:57.681213'),(7,'inter_satellite','satellite',7,'satellite',8,7.2,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.682008','2026-10-25 19:39:57.682008'),(8,'inter_satellite','satellite',8,'satellite',9,7.5,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.682860','2026-10-25 19:39:57.682860'),(9,'inter_satellite','satellite',9,'satellite',10,7.800000000000001,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.683589','2026-10-25 19:39:57.683589'),(10,'inter_satellite','satellite',10,'satellite',1,8.1,10000,1,1,'{\"optical_isl\": true, \"wavelength_nm\": 1550}','2026-10-25 19:39:57.684264','2026-10-25 19:39:57.684264'),(11,'satellite_ground','satellite',1,'ground_station',1,18.2,1200,2.5,1,'{\"feeder_link\": true, \"downlink_freq_ghz\": 26.5}','2026-10-25 19:39:57.684924','2026-10-25 19:39:57.684924'),(12,'satellite_ground','satellite',2,'ground_station',2,19.7,1200,2.5,1,'{\"feeder_link\": true, \"downlink_freq_ghz\": 26.5}','2026-10-25 19:39:57.685594','2026-10-25 19:39:57.685594'),(13,'satellite_ground','satellite',3,'ground_station',3,21.2,1200,2.5,1,'{\"feeder_link\": true, \"downlink_freq_ghz\": 26.5}','2026-10-25 19:39:57.686267','2026-10-25 19:39:57.686267'),(14,'satellite_ground','satellite',4,'ground_station',4,22.7,1200,2.5,1,'{\"feeder_link\": true, \"downlink_freq_ghz\": 26.5}','2026-10-25 19:39:57.686916','2026-10-25 19:39:57.686916'),(15,'satellite_ground','satellite',5,'ground_station',5,24.2,1200,2.5,1,'{\"feeder_link\": true, \"downlink_freq_ghz\": 26.5}','2026-10-25 19:39:57.687753','2026-10-25 19:39:57.687753'),(16,'satellite_ground','satellite',6,'ground_station',6,25.7,1200,2.5,1,'{\"feeder_link\": true, \"downlink_freq_ghz\": 26.5}','2026-10-25 19:39:57.689405','2026-10-25 19:39:57.689405');
/*!40000 ALTER TABLE `links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passes`
--

DROP TABLE IF EXISTS `passes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `passes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `satellite_id` int NOT NULL,
  `station_id` int NOT NULL,
  `aos` datetime(6) NOT NULL,
  `los` datetime(6) NOT NULL,
  `max_elevation_time` datetime(6) DEFAULT NULL,
  `max_elevation_deg` double DEFAULT NULL,
  `duration_seconds` double NOT NULL,
  `is_scheduled` tinyint(1) NOT NULL DEFAULT '0',
  `priority` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `ix_passes_satellite_id` (`satellite_id`),
  KEY `ix_passes_station_id` (`station_id`),
  KEY `ix_passes_aos` (`aos`),
  CONSTRAINT `fk_passes_station` FOREIGN KEY (`station_id`) REFERENCES `ground_stations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passes`
--

LOCK TABLES `passes` WRITE;
/*!40000 ALTER TABLE `passes` DISABLE KEYS */;
INSERT INTO `passes` VALUES (1,1,1,'2026-10-25 14:34:57.631397','2026-10-25 14:42:57.631397','2026-10-25 14:38:57.631397',25,480,1,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.632743'),(2,1,3,'2026-10-25 16:04:57.631397','2026-10-25 16:14:23.631397','2026-10-25 16:09:40.631397',83,566,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.633817'),(3,1,5,'2026-10-25 17:34:57.631397','2026-10-25 17:45:49.631397','2026-10-25 17:40:23.631397',76,652,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.634967'),(4,2,2,'2026-10-25 19:24:57.631397','2026-10-25 19:34:17.631397','2026-10-25 19:29:37.631397',71,560,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.636388'),(5,2,4,'2026-10-25 21:24:57.631397','2026-10-25 21:35:43.631397','2026-10-25 21:30:20.631397',64,646,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.637834'),(6,2,6,'2026-10-25 23:24:57.631397','2026-10-25 23:37:09.631397','2026-10-25 23:31:03.631397',57,732,1,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.638847'),(7,3,1,'2026-10-26 01:59:57.631397','2026-10-26 02:09:11.631397','2026-10-26 02:04:34.631397',59,554,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.640072'),(8,3,3,'2026-10-26 04:09:57.631397','2026-10-26 04:20:37.631397','2026-10-26 04:15:17.631397',52,640,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.641260'),(9,3,5,'2026-10-26 06:39:57.631397','2026-10-26 06:52:03.631397','2026-10-26 06:46:00.631397',45,726,1,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.642536'),(10,4,2,'2026-10-26 09:14:57.631397','2026-10-26 09:25:31.631397','2026-10-26 09:20:14.631397',40,634,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.643521'),(11,4,4,'2026-10-26 11:44:57.631397','2026-10-26 11:56:57.631397','2026-10-26 11:50:57.631397',33,720,1,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.644397'),(12,4,6,'2026-10-26 14:04:57.631397','2026-10-26 14:18:23.631397','2026-10-26 14:11:40.631397',26,806,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.645333'),(13,5,1,'2026-10-25 15:34:57.631397','2026-10-25 15:45:25.631397','2026-10-25 15:40:11.631397',28,628,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.646805'),(14,5,3,'2026-10-25 17:04:57.631397','2026-10-25 17:16:51.631397','2026-10-25 17:10:54.631397',86,714,1,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.647689'),(15,5,5,'2026-10-25 18:34:57.631397','2026-10-25 18:48:17.631397','2026-10-25 18:41:37.631397',79,800,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.648723'),(16,6,2,'2026-10-25 20:24:57.631397','2026-10-25 20:36:45.631397','2026-10-25 20:30:51.631397',74,708,1,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.649752'),(17,6,4,'2026-10-25 22:24:57.631397','2026-10-25 22:38:11.631397','2026-10-25 22:31:34.631397',67,794,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.650991'),(18,6,6,'2026-10-26 00:24:57.631397','2026-10-26 00:33:37.631397','2026-10-26 00:29:17.631397',60,520,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.652190'),(19,7,1,'2026-10-26 02:59:57.631397','2026-10-26 03:11:39.631397','2026-10-26 03:05:48.631397',62,702,1,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.653082'),(20,7,3,'2026-10-26 05:09:57.631397','2026-10-26 05:23:05.631397','2026-10-26 05:16:31.631397',55,788,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.653868'),(21,7,5,'2026-10-26 07:39:57.631397','2026-10-26 07:48:31.631397','2026-10-26 07:44:14.631397',48,514,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.654635'),(22,8,2,'2026-10-26 10:14:57.631397','2026-10-26 10:27:59.631397','2026-10-26 10:21:28.631397',43,782,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.655351'),(23,8,4,'2026-10-26 12:44:57.631397','2026-10-26 12:53:25.631397','2026-10-26 12:49:11.631397',36,508,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.656148'),(24,8,6,'2026-10-26 15:04:57.631397','2026-10-26 15:14:51.631397','2026-10-26 15:09:54.631397',29,594,1,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.657168'),(25,9,1,'2026-10-25 16:34:57.631397','2026-10-25 16:47:53.631397','2026-10-25 16:41:25.631397',31,776,0,'medium','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.657968'),(26,9,3,'2026-10-25 18:04:57.631397','2026-10-25 18:13:19.631397','2026-10-25 18:09:08.631397',89,502,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.659429'),(27,9,5,'2026-10-25 19:34:57.631397','2026-10-25 19:44:45.631397','2026-10-25 19:39:51.631397',82,588,1,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.660904'),(28,10,2,'2026-10-25 21:24:57.631397','2026-10-25 21:33:13.631397','2026-10-25 21:29:05.631397',77,496,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.662324'),(29,10,4,'2026-10-25 23:24:57.631397','2026-10-25 23:34:39.631397','2026-10-25 23:29:48.631397',70,582,1,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.663521'),(30,10,6,'2026-10-26 01:24:57.631397','2026-10-26 01:36:05.631397','2026-10-26 01:30:31.631397',63,668,0,'high','{\"azimuth_aos_deg\": 120.0, \"doppler_shift_khz\": 24.5}','2026-10-25 19:39:57.664689');
/*!40000 ALTER TABLE `passes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `policies`
--

DROP TABLE IF EXISTS `policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `policies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `latency_weight` double NOT NULL DEFAULT '1',
  `cost_weight` double NOT NULL DEFAULT '0.5',
  `hop_weight` double NOT NULL DEFAULT '0.3',
  `max_latency_ms` double DEFAULT NULL,
  `max_hops` int DEFAULT NULL,
  `max_cost` double DEFAULT NULL,
  `preferred_ground_stations` json DEFAULT NULL,
  `avoided_ground_stations` json DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_policies_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `policies`
--

LOCK TABLES `policies` WRITE;
/*!40000 ALTER TABLE `policies` DISABLE KEYS */;
INSERT INTO `policies` VALUES (1,'Lowest Latency Routing','Optimizes paths strictly for minimum round-trip delay across optical ISLs',1,0.1,0.2,120,6,20,'[\"Svalbard (SvalSat) - Norway\", \"Wallops Island - NASA US\"]','[]',1,'{\"target_workload\": \"realtime_telemetry\"}','2026-10-25 19:39:57.701524','2026-10-25 19:39:57.701524'),(2,'Cost Optimized Routing','Minimizes ground station and downlink fees by batching over lower-cost stations',0.2,1,0.4,300,8,5,'[\"Wallops Island - NASA US\", \"AWS Ground Station - US West\"]','[]',0,'{\"target_workload\": \"bulk_earth_observation\"}','2026-10-25 19:39:57.702897','2026-10-25 19:39:57.702897'),(3,'High Reliability Resilient','Multi-path redundant routing with hop count caps and high elevation constraints',0.6,0.3,0.5,150,4,15,'[]','[]',0,'{\"target_workload\": \"critical_command_uplink\"}','2026-10-25 19:39:57.703860','2026-10-25 19:39:57.703860');
/*!40000 ALTER TABLE `policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `routing_policies`
--

DROP TABLE IF EXISTS `routing_policies`;
/*!50001 DROP VIEW IF EXISTS `routing_policies`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `routing_policies` AS SELECT 
 1 AS `id`,
 1 AS `name`,
 1 AS `description`,
 1 AS `latency_weight`,
 1 AS `cost_weight`,
 1 AS `hop_weight`,
 1 AS `max_latency_ms`,
 1 AS `max_hops`,
 1 AS `max_cost`,
 1 AS `preferred_ground_stations`,
 1 AS `avoided_ground_stations`,
 1 AS `is_default`,
 1 AS `metadata`,
 1 AS `created_at`,
 1 AS `updated_at`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `satellites`
--

DROP TABLE IF EXISTS `satellites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `satellites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `constellation_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `norad_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `international_designator` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tle_line1` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tle_line2` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tle_epoch` datetime(6) DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operational',
  `health_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'healthy',
  `mass_kg` double DEFAULT NULL,
  `power_watts` double DEFAULT NULL,
  `orbit_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `ix_satellites_norad_id` (`norad_id`),
  KEY `ix_satellites_constellation_id` (`constellation_id`),
  CONSTRAINT `fk_satellites_constellation` FOREIGN KEY (`constellation_id`) REFERENCES `constellations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `satellites`
--

LOCK TABLES `satellites` WRITE;
/*!40000 ALTER TABLE `satellites` DISABLE KEYS */;
INSERT INTO `satellites` VALUES (1,1,'ISS (ZARYA)','25544',NULL,'1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9021','2 25544  51.6400 208.9163 0006703 280.7808  79.2154 15.49815776    29',NULL,'operational','healthy',420000,84000,'LEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.607924','2026-10-25 19:39:56.607924'),(2,1,'STARLINK-1007','44713',NULL,'1 44713U 19074A   24001.50000000  .00001234  00000-0  98765-4 0  9012','2 44713  53.0000 120.0000 0001500 100.0000 260.0000 15.06000000123456',NULL,'operational','healthy',260,1500,'LEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.613099','2026-10-25 19:39:56.613099'),(3,1,'STARLINK-1008','44714',NULL,'1 44714U 19074B   24001.50000000  .00001234  00000-0  98765-4 0  9013','2 44714  53.0000 121.0000 0001500 101.0000 259.0000 15.06000000123457',NULL,'operational','healthy',260,1500,'LEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.619190','2026-10-25 19:39:56.619190'),(4,1,'STARLINK-1009','44715',NULL,'1 44715U 19074C   24001.50000000  .00001234  00000-0  98765-4 0  9014','2 44715  53.0000 122.0000 0001500 102.0000 258.0000 15.06000000123458',NULL,'operational','healthy',260,1500,'LEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.623837','2026-10-25 19:39:56.623837'),(5,1,'STARLINK-1010','44716',NULL,'1 44716U 19074D   24001.50000000  .00001234  00000-0  98765-4 0  9015','2 44716  53.0000 123.0000 0001500 103.0000 257.0000 15.06000000123459',NULL,'operational','healthy',260,1500,'LEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.629176','2026-10-25 19:39:56.629176'),(6,1,'STARLINK-1011','44717',NULL,'1 44717U 19074E   24001.50000000  .00001234  00000-0  98765-4 0  9016','2 44717  53.0000 124.0000 0001500 104.0000 256.0000 15.06000000123460',NULL,'operational','healthy',260,1500,'LEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.634370','2026-10-25 19:39:56.634370'),(7,1,'GPS IIF-12','40730',NULL,'1 40730U 15036A   24001.50000000  .00000045  00000-0  00000-0 0  9011','2 40730  55.0000  95.0000 0012000  45.0000 315.0000  2.00560000 62104',NULL,'operational','healthy',1630,2400,'MEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.638145','2026-10-25 19:39:56.638145'),(8,1,'ONEWEB-0045','48925',NULL,'1 48925U 21060A   24001.50000000  .00000210  00000-0  45678-4 0  9018','2 48925  87.4000 142.0000 0001200  80.0000 280.0000 13.10000000142345',NULL,'operational','healthy',147,800,'LEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.642057','2026-10-25 19:39:56.642057'),(9,1,'PLANET DOVE-123','49123',NULL,'1 49123U 21080A   24001.50000000  .00001560  00000-0  12345-3 0  9019','2 49123  97.5000  58.2000 0001800  90.0000 270.0000 15.20000000152341',NULL,'operational','healthy',5,50,'SSO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.646739','2026-10-25 19:39:56.646739'),(10,1,'SPIRE LEMUR-89','49189',NULL,'1 49189U 21095A   24001.50000000  .00001450  00000-0  11234-3 0  9020','2 49189  85.0000  78.9000 0001600  95.0000 265.0000 15.15000000151239',NULL,'operational','healthy',4.5,40,'LEO','{\"transponder\": \"operational\", \"active_payload\": true}','2026-10-25 19:39:56.653288','2026-10-25 19:39:56.653288');
/*!40000 ALTER TABLE `satellites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` datetime(6) NOT NULL,
  `end_time` datetime(6) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_optimized` tinyint(1) NOT NULL DEFAULT '0',
  `scheduled_passes` json DEFAULT NULL,
  `total_contact_minutes` double DEFAULT '0',
  `total_data_volume_mb` double DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES (1,'Nominal 24-Hour Downlink Plan','2026-10-25 14:09:57.734460','2026-10-26 14:09:57.734460',1,1,'[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]',142.5,58400,'{\"generated_by\": \"PassSchedulerAgent\", \"optimization_solver\": \"heuristic\"}','2026-10-25 19:39:57.736384','2026-10-25 19:39:57.736384');
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tle_records`
--

DROP TABLE IF EXISTS `tle_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tle_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `norad_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tle_line1` varchar(70) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tle_line2` varchar(70) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'celestrak',
  `epoch` datetime(6) DEFAULT NULL,
  `fetched_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `ix_tle_records_norad_id` (`norad_id`),
  KEY `ix_tle_records_fetched_at` (`fetched_at`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tle_records`
--

LOCK TABLES `tle_records` WRITE;
/*!40000 ALTER TABLE `tle_records` DISABLE KEYS */;
INSERT INTO `tle_records` VALUES (1,'25544','ISS (ZARYA)','1 25544U 98067A   24001.50000000  .00016717  00000-0  10270-3 0  9021','2 25544  51.6400 208.9163 0006703 280.7808  79.2154 15.49815776    29','celestrak',NULL,'2026-10-25 19:39:56.611929'),(2,'44713','STARLINK-1007','1 44713U 19074A   24001.50000000  .00001234  00000-0  98765-4 0  9012','2 44713  53.0000 120.0000 0001500 100.0000 260.0000 15.06000000123456','celestrak',NULL,'2026-10-25 19:39:56.617828'),(3,'44714','STARLINK-1008','1 44714U 19074B   24001.50000000  .00001234  00000-0  98765-4 0  9013','2 44714  53.0000 121.0000 0001500 101.0000 259.0000 15.06000000123457','celestrak',NULL,'2026-10-25 19:39:56.622667'),(4,'44715','STARLINK-1009','1 44715U 19074C   24001.50000000  .00001234  00000-0  98765-4 0  9014','2 44715  53.0000 122.0000 0001500 102.0000 258.0000 15.06000000123458','celestrak',NULL,'2026-10-25 19:39:56.627203'),(5,'44716','STARLINK-1010','1 44716U 19074D   24001.50000000  .00001234  00000-0  98765-4 0  9015','2 44716  53.0000 123.0000 0001500 103.0000 257.0000 15.06000000123459','celestrak',NULL,'2026-10-25 19:39:56.632966'),(6,'44717','STARLINK-1011','1 44717U 19074E   24001.50000000  .00001234  00000-0  98765-4 0  9016','2 44717  53.0000 124.0000 0001500 104.0000 256.0000 15.06000000123460','celestrak',NULL,'2026-10-25 19:39:56.637141'),(7,'40730','GPS IIF-12','1 40730U 15036A   24001.50000000  .00000045  00000-0  00000-0 0  9011','2 40730  55.0000  95.0000 0012000  45.0000 315.0000  2.00560000 62104','celestrak',NULL,'2026-10-25 19:39:56.640840'),(8,'48925','ONEWEB-0045','1 48925U 21060A   24001.50000000  .00000210  00000-0  45678-4 0  9018','2 48925  87.4000 142.0000 0001200  80.0000 280.0000 13.10000000142345','celestrak',NULL,'2026-10-25 19:39:56.645142'),(9,'49123','PLANET DOVE-123','1 49123U 21080A   24001.50000000  .00001560  00000-0  12345-3 0  9019','2 49123  97.5000  58.2000 0001800  90.0000 270.0000 15.20000000152341','celestrak',NULL,'2026-10-25 19:39:56.651655'),(10,'49189','SPIRE LEMUR-89','1 49189U 21095A   24001.50000000  .00001450  00000-0  11234-3 0  9020','2 49189  85.0000  78.9000 0001600  95.0000 265.0000 15.15000000151239','celestrak',NULL,'2026-10-25 19:39:56.660274');
/*!40000 ALTER TABLE `tle_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hashed_password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'viewer',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `api_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `last_login` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_api_key` (`api_key`),
  KEY `ix_users_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'demo_viewer','viewer@demo.constellation-hub.local','$2b$12$Q4x4N3YG3Km/s0iQgkw8/.WhVhVO0mrUf/3fAja1MvNqCimEk9HE6','Demo Viewer','Demo Viewer','viewer',1,NULL,'2026-10-25 19:39:56.998434',NULL),(2,'demo_ops','ops@demo.constellation-hub.local','$2b$12$MrHusoqLlQuv4MK7qAuZQunYRItxGmaD4hdh6I51j9.250Tvw86Se','Demo Operator','Demo Operator','operator',1,NULL,'2026-10-25 19:39:57.299450',NULL),(3,'demo_admin','admin@demo.constellation-hub.local','$2b$12$czPs9i6VX3lmec2iZHsJ/OM3sVYPRXdRzKP/rU7inbKtfIjHMohGG','Demo Administrator','Demo Administrator','admin',1,NULL,'2026-10-25 19:39:57.616923',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `routing_policies`
--

/*!50001 DROP VIEW IF EXISTS `routing_policies`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`constellation`@`127.0.0.1` SQL SECURITY DEFINER */
/*!50001 VIEW `routing_policies` AS select `policies`.`id` AS `id`,`policies`.`name` AS `name`,`policies`.`description` AS `description`,`policies`.`latency_weight` AS `latency_weight`,`policies`.`cost_weight` AS `cost_weight`,`policies`.`hop_weight` AS `hop_weight`,`policies`.`max_latency_ms` AS `max_latency_ms`,`policies`.`max_hops` AS `max_hops`,`policies`.`max_cost` AS `max_cost`,`policies`.`preferred_ground_stations` AS `preferred_ground_stations`,`policies`.`avoided_ground_stations` AS `avoided_ground_stations`,`policies`.`is_default` AS `is_default`,`policies`.`metadata` AS `metadata`,`policies`.`created_at` AS `created_at`,`policies`.`updated_at` AS `updated_at` from `policies` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-25 19:51:05
