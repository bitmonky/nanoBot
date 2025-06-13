## PHP example of the central server 

nanoBots call this to get work assignments. 

## Create table for the job file on the server.

```
CREATE TABLE `tblDredgeWorkerJob` (
  `workID` bigint(20) NOT NULL AUTO_INCREMENT,
  `workQueID` bigint(20) DEFAULT NULL,
  `workJobID` bigint(20) DEFAULT NULL,
  `workURL` varchar(345) DEFAULT NULL,
  `workAction` varchar(45) DEFAULT NULL,
  `workUAgent` varchar(345) DEFAULT NULL,
  `workVPWidth` int(11) DEFAULT NULL,
  `workVPHeight` int(11) DEFAULT NULL,
  `workMUID` varchar(84) DEFAULT NULL,
  `workDate` datetime DEFAULT NULL,
  `workStatus` varchar(45) DEFAULT NULL,
  `workDocument` longtext DEFAULT NULL,
  `workStarted` datetime DEFAULT NULL,
  `workPayment` decimal(29,9) DEFAULT NULL,
  `workTrys` int(11) DEFAULT 0,
  `workSubCmd` varchar(45) DEFAULT NULL,
  `workResponseCD` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`workID`),
  KEY `ndxWorkMUID` (`workMUID`),
  KEY `ndxWorkDate` (`workDate`),
  KEY `ndxWorkStatus` (`workStatus`),
  KEY `ndxWorkStarted` (`workStarted`),
  KEY `ndxWorkURL` (`workURL`(191)),
  KEY `ndxWorkJobID` (`workJobID`),
  KEY `ndxWorkQueID` (`workQueID`),
  KEY `ndxWorkAction` (`workAction`),
  KEY `ndxWorkTrys` (`workTrys`),
  KEY `ndxWorkResponseCD` (`workResponseCD`),
  KEY `ndxWorkSubCmd` (`workSubCmd`),
  KEY `ndxWorkPVHeight` (`workVPHeight`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_czech_ci
```
