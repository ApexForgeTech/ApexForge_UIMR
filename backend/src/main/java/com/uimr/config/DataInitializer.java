package com.uimr.config;

import com.uimr.dto.request.RegisterRequest;
import com.uimr.model.*;
import com.uimr.model.enums.*;
import com.uimr.repository.*;
import com.uimr.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final IncidentRepository incidentRepository;
    private final IocRepository iocRepository;
    private final PlaybookRepository playbookRepository;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (userRepository.count() == 0) {
                // === USERS ===
                User admin = createUser("admin", "admin123", "admin@uimr.local", "System Administrator", UserRole.ADMIN);
                User analyst1 = createUser("analyst", "analyst123", "analyst1@uimr.local", "Farid Mammadov", UserRole.ANALYST);
                User analyst2 = createUser("analyst2", "analyst123", "analyst2@uimr.local", "Aysel Hasanova", UserRole.ANALYST);

                log.info("Created 3 users: admin, analyst, analyst2");

                // === INCIDENTS ===
                Incident inc1 = createIncident("SIEM: Brute Force Login Attack",
                    "Multiple failed SSH login attempts detected from IP 185.220.101.50. 147 attempts in 10 minutes targeting root and admin accounts on production server PROD-DB01. Splunk correlation rule BF-DETECT-001 triggered.",
                    Severity.HIGH, IncidentSource.SIEM, IncidentStatus.OPEN, admin, analyst1, "SPLUNK-2026-4521");

                Incident inc2 = createIncident("EDR: Suspicious PowerShell Execution",
                    "CrowdStrike Falcon detected powershell.exe spawned by winword.exe on HOST-PC019 (user: finance_dept\\j.smith). Base64 encoded command detected. Process tree: OUTLOOK.EXE → WINWORD.EXE → POWERSHELL.EXE. Falcon alert severity: Critical.",
                    Severity.CRITICAL, IncidentSource.EDR, IncidentStatus.IN_PROGRESS, admin, analyst2, "CS-FALCON-8892");

                Incident inc3 = createIncident("FW: C2 Communication Detected",
                    "Palo Alto PA-3260 blocked outbound TCP connection from 10.0.1.45 to known APT29 C2 infrastructure at 185.220.101.34:443. Threat intelligence match: MISP Event #8923. Additional DNS queries to evil-c2.xyz observed.",
                    Severity.HIGH, IncidentSource.FIREWALL, IncidentStatus.OPEN, admin, analyst1, "PA-THREAT-3301");

                Incident inc4 = createIncident("Email: Phishing Campaign Targeting Finance",
                    "Proofpoint TAP detected targeted phishing campaign. Sender: hr-update@1egitimate-bank.com (spoofed). Subject: 'Urgent: Salary Revision Document'. Malicious attachment: salary_update.docm (VBA macro dropper). 15 recipients in finance dept, 3 clicked.",
                    Severity.CRITICAL, IncidentSource.EMAIL_GATEWAY, IncidentStatus.OPEN, admin, null, "PROOFPOINT-TAP-7721");

                Incident inc5 = createIncident("IDS: SQL Injection on Production Web App",
                    "Snort IDS rule SID:2100498 triggered. SQL injection payload detected on /api/v1/users/search endpoint. Source IP: 203.0.113.42 (TOR exit node). Payload: ' UNION SELECT username, password FROM users --. 47 requests in 2 minutes.",
                    Severity.HIGH, IncidentSource.IDS_IPS, IncidentStatus.OPEN, admin, analyst2, "SNORT-SQL-2100498");

                Incident inc6 = createIncident("TI: Emotet Malware Domain Resolution",
                    "Internal DNS server logged resolution of domains associated with Emotet botnet by workstation WS-ACCT-07. Domains: emotet-loader.xyz, cdn-malware-update.cc. Matched against URLHaus and AlienVault OTX feeds. Host needs immediate isolation.",
                    Severity.CRITICAL, IncidentSource.THREAT_INTEL, IncidentStatus.IN_PROGRESS, admin, analyst1, "URLHaus-EMOTET-9912");

                Incident inc7 = createIncident("Manual: Unauthorized USB Device Connected",
                    "Security officer reported unauthorized USB storage device connected to server room workstation SRV-CONSOLE-01. Employee ID: SEC-0045. Device contained unknown executable files. Physical security review required.",
                    Severity.MEDIUM, IncidentSource.MANUAL, IncidentStatus.OPEN, admin, null, null);

                // Close one incident
                inc3.setStatus(IncidentStatus.CLOSED);
                inc3.setClassification(Classification.TRUE_POSITIVE);
                inc3.setClosedAt(inc3.getCreatedAt().plusHours(4));
                incidentRepository.save(inc3);

                log.info("Created 7 realistic incidents");

                // === IOCs ===
                createIoc(inc1, IocType.IP, "185.220.101.50", analyst1);
                createIoc(inc1, IocType.IP, "10.0.1.15", analyst1);

                createIoc(inc2, IocType.HASH_SHA256, "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456", analyst2);
                createIoc(inc2, IocType.FILENAME, "stage2_dropper.ps1", analyst2);
                createIoc(inc2, IocType.IP, "192.168.10.19", analyst2);

                createIoc(inc3, IocType.IP, "185.220.101.34", analyst1);
                createIoc(inc3, IocType.DOMAIN, "evil-c2.xyz", analyst1);

                createIoc(inc4, IocType.EMAIL, "hr-update@1egitimate-bank.com", admin);
                createIoc(inc4, IocType.HASH_MD5, "d41d8cd98f00b204e9800998ecf8427e", admin);
                createIoc(inc4, IocType.FILENAME, "salary_update.docm", admin);
                createIoc(inc4, IocType.URL, "https://1egitimate-bank.com/download/payload.exe", admin);

                createIoc(inc5, IocType.IP, "203.0.113.42", analyst2);

                createIoc(inc6, IocType.DOMAIN, "emotet-loader.xyz", analyst1);
                createIoc(inc6, IocType.DOMAIN, "cdn-malware-update.cc", analyst1);
                createIoc(inc6, IocType.IP, "10.0.2.107", analyst1);

                log.info("Created 15 IOCs across incidents");

                // === PLAYBOOKS ===
                createPlaybook("Ransomware Containment",
                    "Automated containment workflow for ransomware incidents. Isolates infected hosts, blocks C2 IPs on firewall, disables compromised accounts, and triggers forensic data collection.",
                    "[{\"name\":\"Isolate Infected Host\",\"action\":\"EDR API: network_isolate\"},{\"name\":\"Block C2 IPs on Firewall\",\"action\":\"FW API: block_ip_list\"},{\"name\":\"Disable Compromised Account\",\"action\":\"AD API: disable_user\"},{\"name\":\"Collect Forensic Data\",\"action\":\"EDR API: get_memory_dump\"},{\"name\":\"Notify SOC Manager\",\"action\":\"Telegram: send_alert\"}]",
                    "/api/soar/ransomware-containment", admin);

                createPlaybook("Phishing Response",
                    "Automated response for phishing incidents. Blocks sender, quarantines emails from same sender, checks if attachments were opened, and resets passwords of affected users.",
                    "[{\"name\":\"Block Sender Domain\",\"action\":\"Email Gateway: block_sender\"},{\"name\":\"Quarantine Related Emails\",\"action\":\"Email Gateway: quarantine_by_sender\"},{\"name\":\"Check Attachment Opens\",\"action\":\"EDR API: search_file_hash\"},{\"name\":\"Reset Affected Passwords\",\"action\":\"AD API: force_password_reset\"},{\"name\":\"Generate IOC Report\",\"action\":\"TI: export_iocs\"}]",
                    "/api/soar/phishing-response", admin);

                createPlaybook("Suspicious Login Investigation",
                    "Investigation playbook for suspicious login attempts. Enriches IPs against TI, checks geolocation anomalies, reviews recent authentication logs, and creates summary report.",
                    "[{\"name\":\"Enrich Source IP\",\"action\":\"TI API: check_ip_reputation\"},{\"name\":\"Check Geolocation\",\"action\":\"GeoIP: lookup_location\"},{\"name\":\"Review Auth Logs\",\"action\":\"SIEM: query_auth_events\"},{\"name\":\"Generate Report\",\"action\":\"Report: create_summary\"}]",
                    null, admin);

                log.info("Created 3 playbooks with real steps");
                log.info("=== UIMR Data initialization complete ===");
            }
        };
    }

    private User createUser(String username, String password, String email, String fullName, UserRole role) {
        RegisterRequest req = new RegisterRequest();
        req.setUsername(username);
        req.setPassword(password);
        req.setEmail(email);
        req.setFullName(fullName);
        authService.register(req);
        User user = userRepository.findByUsername(username).orElseThrow();
        user.setRole(role);
        return userRepository.save(user);
    }

    private Incident createIncident(String title, String description, Severity severity,
                                     IncidentSource source, IncidentStatus status,
                                     User creator, User assignee, String sourceRef) {
        Incident incident = Incident.builder()
                .title(title)
                .description(description)
                .severity(severity)
                .source(source)
                .status(status)
                .createdBy(creator)
                .assignee(assignee)
                .sourceRef(sourceRef)
                .build();
        return incidentRepository.save(incident);
    }

    private void createIoc(Incident incident, IocType type, String value, User addedBy) {
        Ioc ioc = Ioc.builder()
                .incident(incident)
                .type(type)
                .value(value)
                .addedBy(addedBy)
                .build();
        iocRepository.save(ioc);
    }

    private void createPlaybook(String name, String description, String stepsJson, String soarEndpoint, User creator) {
        Playbook pb = Playbook.builder()
                .name(name)
                .description(description)
                .stepsJson(stepsJson)
                .soarEndpoint(soarEndpoint)
                .createdBy(creator)
                .build();
        playbookRepository.save(pb);
    }
}
