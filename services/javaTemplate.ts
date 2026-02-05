
export const JAVA_BASTION_SOURCE = `/**
 * BASTION SECURE ENCLAVE // JAVA RUNTIME
 * v3.5.2
 *
 * [MISSION]
 * "If the web disappears, Bastion still works."
 *
 * [MODES]
 * 1. GUI Mode: java Bastion
 * 2. CLI Mode: java Bastion shell
 *
 * [COMPILATION]
 * javac Bastion.java
 */

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.awt.datatransfer.StringSelection;
import java.awt.event.*;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.*;
import java.util.List;

public class Bastion extends JFrame {

    // --- THEME CONSTANTS (GUI) ---
    private static final Color COL_BG = new Color(2, 6, 23);
    private static final Color COL_PANEL = new Color(15, 23, 42);
    private static final Color COL_ACCENT = new Color(99, 102, 241);
    private static final Color COL_TEXT = new Color(241, 245, 249);
    private static final Color COL_TEXT_DIM = new Color(148, 163, 184);
    private static final Color COL_BORDER = new Color(51, 65, 85);
    private static final Color COL_SUCCESS = new Color(16, 185, 129);
    private static final Color COL_DANGER = new Color(239, 68, 68);
    private static final Color COL_AMBER = new Color(245, 158, 11);
    private static final Font FONT_MONO = new Font("Monospaced", Font.BOLD, 14);
    private static final Font FONT_TITLE = new Font("SansSerif", Font.BOLD, 24);

    // --- STATE ---
    private CardLayout cardLayout;
    private JPanel mainPanel;
    private JPasswordField masterPasswordField; 
    private JTextArea vaultBlobArea;
    
    // VAULT DATA (In-Memory)
    private static String masterEntropy = null;
    private static List<Map<String, Object>> vaultConfigs = new ArrayList<>();
    private static List<Map<String, Object>> vaultNotes = new ArrayList<>();
    private static List<Map<String, Object>> vaultContacts = new ArrayList<>();
    private static List<Map<String, Object>> lockerEntries = new ArrayList<>();
    private static Object vaultIdentity = null;
    private static int vaultVersion = 1;
    private static int vaultFlags = 0;
    private static Object legacyOrigin = null;
    
    // GUI Lists
    private DefaultListModel<Map<String, Object>> vaultListModel;
    private DefaultListModel<Map<String, Object>> lockerListModel;

    public static void main(String[] args) {
        if (args.length > 0) {
            if (args[0].equals("shell") || args[0].equals("--cli")) {
                new BastionCLI().run();
            } else if (args[0].equals("--version")) {
                System.out.println("{\\"product\\": \\"Bastion\\", \\"version\\": \\"3.5.2\\", \\"protocol\\": \\"Sovereign-V3\\"}");
            } else {
                System.out.println("Usage: java Bastion [shell|--version]");
            }
            return;
        }

        // Default: GUI
        System.setProperty("awt.useSystemAAFontSettings", "on");
        SwingUtilities.invokeLater(() -> {
            try { new Bastion().setVisible(true); } catch (Exception e) { e.printStackTrace(); }
        });
    }

    // ==========================================
    //               CLI IMPLEMENTATION
    // ==========================================
    static class BastionCLI {
        private Scanner scanner;
        private boolean running = true;

        public BastionCLI() {
            this.scanner = new Scanner(System.in);
        }

        public void run() {
            printHeader();
            
            while (running) {
                System.out.print("bastion> ");
                String line = scanner.nextLine().trim();
                if (line.isEmpty()) continue;
                
                String[] parts = line.split("\\\\s+");
                String cmd = parts[0].toLowerCase();

                try {
                    switch (cmd) {
                        case "help": printHelp(); break;
                        case "exit": running = false; break;
                        case "unlock": handleUnlock(); break;
                        case "restore": handleRestore(parts); break;
                        case "info": handleInfo(); break;
                        case "search": handleSearch(parts); break;
                        case "get": handleGet(parts); break;
                        case "gen": handleGen(parts); break;
                        case "add": handleAdd(); break;
                        case "rm": handleRm(parts); break;
                        case "save": handleSave(); break;
                        case "export": handleExport(); break;
                        default: System.out.println("Unknown command. Type 'help'.");
                    }
                } catch (Exception e) {
                    System.out.println("Error: " + e.getMessage());
                }
            }
        }

        private void printHeader() {
            System.out.println("BASTION ENCLAVE // SHELL v3.5.2");
            System.out.println("Sovereign Protocol Active. Type 'help' for commands.");
        }

        private void printHelp() {
            System.out.println("COMMANDS:");
            System.out.println("  unlock        - Decrypt a vault blob");
            System.out.println("  restore <hex> - Initialize empty vault from Master Seed");
            System.out.println("  info          - Show vault status");
            System.out.println("  search <q>    - Search credentials");
            System.out.println("  get <id>      - Reveal password for ID");
            System.out.println("  add           - Add new credential (Interactive)");
            System.out.println("  rm <id>       - Remove credential");
            System.out.println("  save          - Encrypt and export vault state");
            System.out.println("  export        - DUMP FULL PLAINTEXT JSON (Agent Use Only)");
            System.out.println("  gen <s> <u>   - Generate ephemeral password (Service, User)");
            System.out.println("  exit          - Close session");
        }

        private void handleUnlock() throws Exception {
            System.out.print("Enter Vault Blob (Base64): ");
            String blob = scanner.nextLine().trim();
            if (blob.isEmpty()) return;

            Console console = System.console();
            String pass;
            if (console != null) {
                pass = new String(console.readPassword("Master Password: "));
            } else {
                System.out.print("Master Password: ");
                pass = scanner.nextLine();
            }

            String json = ChaosEngine.decryptVault(blob, pass);
            parseAndLoad(json);
            System.out.println("Vault Unlocked. " + Bastion.vaultConfigs.size() + " items loaded.");
        }

        private void handleRestore(String[] parts) {
            if (parts.length < 2) { System.out.println("Usage: restore <64_char_hex_seed>"); return; }
            String seed = parts[1].trim();
            if (!seed.matches("^[0-9a-fA-F]{64}$")) { System.out.println("Invalid seed format."); return; }
            
            Bastion.masterEntropy = seed;
            Bastion.vaultConfigs.clear();
            Bastion.vaultNotes.clear();
            Bastion.vaultContacts.clear();
            Bastion.lockerEntries.clear();
            Bastion.vaultIdentity = null;
            Bastion.vaultVersion = 1;
            
            System.out.println("Identity Restored. Vault is empty (0 items). Use 'add' to populate.");
        }

        private void parseAndLoad(String json) {
            TinyJson parser = new TinyJson(json);
            Map<String, Object> root = (Map<String, Object>) parser.parse();
            Bastion.masterEntropy = (String) root.get("entropy");
            
            // Core Configs
            List<Object> rawConfigs = (List<Object>) root.get("configs");
            Bastion.vaultConfigs.clear();
            if (rawConfigs != null) {
                for (Object o : rawConfigs) Bastion.vaultConfigs.add((Map<String, Object>) o);
            }
            
            // Preservation Fields (Important for Round-Trip Compatibility)
            Bastion.vaultNotes.clear();
            List<Object> rawNotes = (List<Object>) root.get("notes");
            if (rawNotes != null) {
                for (Object o : rawNotes) Bastion.vaultNotes.add((Map<String, Object>) o);
            }
            
            Bastion.vaultContacts.clear();
            List<Object> rawContacts = (List<Object>) root.get("contacts");
            if (rawContacts != null) {
                for (Object o : rawContacts) Bastion.vaultContacts.add((Map<String, Object>) o);
            }
            
            Bastion.lockerEntries.clear();
            List<Object> rawLocker = (List<Object>) root.get("locker");
            if (rawLocker != null) {
                for (Object o : rawLocker) Bastion.lockerEntries.add((Map<String, Object>) o);
            }
            
            Bastion.vaultIdentity = root.get("identity");
            Bastion.vaultVersion = getInt(root.get("version"), 1);
            Bastion.vaultFlags = getInt(root.get("flags"), 0);
            Bastion.legacyOrigin = root.get("legacyOrigin");
        }

        private void handleSave() throws Exception {
            if (Bastion.masterEntropy == null) { System.out.println("Vault locked."); return; }
            
            Console console = System.console();
            String pass;
            if (console != null) {
                pass = new String(console.readPassword("Enter Master Password for Encryption: "));
            } else {
                System.out.print("Enter Master Password for Encryption: ");
                pass = scanner.nextLine();
            }
            
            if (pass.isEmpty()) { System.out.println("Password required."); return; }

            Map<String, Object> state = constructStateMap();
            
            String json = JsonWriter.toJson(state);
            String blob = ChaosEngine.encryptVault(json, pass);
            
            System.out.println("\\n--- BASTION SAVE STATE ---");
            System.out.println("{");
            System.out.println("  \\"version\\": 5,");
            System.out.println("  \\"seed\\": \\"" + Bastion.masterEntropy + "\\",");
            System.out.println("  \\"blob\\": \\"" + blob + "\\"");
            System.out.println("}");
            System.out.println("--- END STATE ---\\n");
        }

        private void handleExport() {
            if (Bastion.masterEntropy == null) { System.out.println("Vault locked."); return; }
            
            System.out.println("\\n!!! WARNING: SENSITIVE DATA DUMP !!!");
            System.out.println("This command outputs your unencrypted vault. Do not share.\\n");
            
            Map<String, Object> state = constructStateMap();
            state.put("version", Bastion.vaultVersion); // Don't increment version for read-only export
            
            String json = JsonWriter.toJson(state);
            System.out.println("--- BEGIN EXPORT ---");
            System.out.println(json);
            System.out.println("--- END EXPORT ---");
        }

        private Map<String, Object> constructStateMap() {
            Map<String, Object> state = new HashMap<>();
            state.put("version", Bastion.vaultVersion + 1); 
            state.put("entropy", Bastion.masterEntropy);
            state.put("configs", Bastion.vaultConfigs);
            state.put("locker", Bastion.lockerEntries);
            state.put("notes", Bastion.vaultNotes);
            state.put("contacts", Bastion.vaultContacts);
            state.put("flags", Bastion.vaultFlags);
            state.put("lastModified", System.currentTimeMillis());
            
            if (Bastion.vaultIdentity != null) state.put("identity", Bastion.vaultIdentity);
            if (Bastion.legacyOrigin != null) state.put("legacyOrigin", Bastion.legacyOrigin);
            
            return state;
        }

        private void handleAdd() {
            if (Bastion.masterEntropy == null) { System.out.println("Vault locked."); return; }
            
            System.out.print("Service Name: ");
            String name = scanner.nextLine().trim();
            System.out.print("Username: ");
            String user = scanner.nextLine().trim();
            
            if (name.isEmpty() || user.isEmpty()) return;
            
            Map<String, Object> config = new HashMap<>();
            config.put("id", UUID.randomUUID().toString().substring(0, 8));
            config.put("name", name);
            config.put("username", user);
            config.put("version", 1);
            config.put("length", 16);
            config.put("useSymbols", true);
            config.put("createdAt", System.currentTimeMillis());
            config.put("category", "login");
            
            Bastion.vaultConfigs.add(config);
            System.out.println("Added. Run 'save' to persist.");
        }

        private void handleRm(String[] parts) {
            if (Bastion.masterEntropy == null) { System.out.println("Vault locked."); return; }
            if (parts.length < 2) return;
            
            String targetId = parts[1];
            Iterator<Map<String, Object>> it = Bastion.vaultConfigs.iterator();
            boolean found = false;
            while(it.hasNext()) {
                Map<String, Object> c = it.next();
                if (((String)c.get("id")).startsWith(targetId)) {
                    it.remove();
                    found = true;
                    break;
                }
            }
            if (found) System.out.println("Removed. Run 'save' to persist.");
            else System.out.println("Not found.");
        }

        private void handleInfo() {
            if (Bastion.masterEntropy == null) {
                System.out.println("Status: LOCKED");
            } else {
                System.out.println("Status: UNLOCKED");
                System.out.println("Entropy: " + Bastion.masterEntropy.substring(0, 8) + "...");
                System.out.println("Items: " + Bastion.vaultConfigs.size());
            }
        }

        private void handleSearch(String[] parts) {
            if (Bastion.masterEntropy == null) { System.out.println("Vault locked."); return; }
            String q = parts.length > 1 ? parts[1].toLowerCase() : "";
            
            System.out.println(String.format("%-8s %-20s %-20s", "ID", "SERVICE", "USERNAME"));
            System.out.println("------------------------------------------------");
            
            int matches = 0;
            for (Map<String, Object> c : Bastion.vaultConfigs) {
                String name = (String) c.getOrDefault("name", "Unknown");
                String user = (String) c.getOrDefault("username", "");
                String id = (String) c.getOrDefault("id", "???");
                
                if (q.isEmpty() || name.toLowerCase().contains(q) || user.toLowerCase().contains(q)) {
                    System.out.println(String.format("%-8s %-20s %-20s", id.substring(0, 8), name, user));
                    matches++;
                }
            }
            System.out.println("Matches: " + matches);
        }

        private void handleGet(String[] parts) throws Exception {
            if (Bastion.masterEntropy == null) { System.out.println("Vault locked."); return; }
            if (parts.length < 2) { System.out.println("Usage: get <id_prefix>"); return; }
            
            String targetId = parts[1];
            Map<String, Object> target = null;
            
            for (Map<String, Object> c : Bastion.vaultConfigs) {
                String id = (String) c.get("id");
                if (id.startsWith(targetId)) {
                    target = c;
                    break;
                }
            }
            
            if (target == null) { System.out.println("Not found."); return; }
            
            String name = (String) target.get("name");
            String user = (String) target.get("username");
            
            String pwd;
            if (target.containsKey("customPassword") && target.get("customPassword") != null && !((String)target.get("customPassword")).isEmpty()) {
                pwd = (String) target.get("customPassword");
            } else {
                int ver = getInt(target.get("version"), 1);
                int len = getInt(target.get("length"), 16);
                boolean sym = getBool(target.get("useSymbols"), true);
                pwd = ChaosEngine.transmute(Bastion.masterEntropy, name, user, ver, len, sym);
            }
            
            System.out.println("Password for " + name + ": " + pwd);
        }

        private void handleGen(String[] parts) throws Exception {
            if (Bastion.masterEntropy == null) { System.out.println("Vault locked."); return; }
            if (parts.length < 3) { System.out.println("Usage: gen <Service> <User>"); return; }
            
            String pwd = ChaosEngine.transmute(Bastion.masterEntropy, parts[1], parts[2], 1, 16, true);
            System.out.println("Generated: " + pwd);
        }
    }

    // ==========================================
    //               GUI IMPLEMENTATION
    // ==========================================

    public Bastion() {
        setTitle("Bastion Secure Enclave");
        setSize(1100, 750);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        getContentPane().setBackground(COL_BG);
        setLayout(new BorderLayout());
        getRootPane().setBorder(new LineBorder(COL_BORDER, 1));
        
        cardLayout = new CardLayout();
        mainPanel = new JPanel(cardLayout);
        mainPanel.setBackground(COL_BG);
        mainPanel.add(createAuthView(), "AUTH");
        mainPanel.add(createAppView(), "APP");
        add(mainPanel, BorderLayout.CENTER);
    }

    private JPanel createAuthView() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBackground(COL_BG);
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        JLabel title = new JLabel("BASTION // ENCLAVE");
        title.setFont(FONT_TITLE);
        title.setForeground(COL_TEXT);
        title.setHorizontalAlignment(SwingConstants.CENTER);
        
        JLabel subtitle = new JLabel("Sovereign Java Runtime v3.5.2");
        subtitle.setFont(FONT_MONO);
        subtitle.setForeground(COL_TEXT_DIM);
        subtitle.setHorizontalAlignment(SwingConstants.CENTER);

        JLabel lblBlob = new JLabel("Vault Blob");
        lblBlob.setForeground(COL_ACCENT);
        
        vaultBlobArea = new JTextArea(5, 50);
        styleTextArea(vaultBlobArea);
        JScrollPane scrollBlob = new JScrollPane(vaultBlobArea);
        scrollBlob.setBorder(new LineBorder(COL_BORDER));

        JLabel lblPass = new JLabel("Master Password");
        lblPass.setForeground(COL_ACCENT);

        masterPasswordField = new JPasswordField(20);
        styleTextField(masterPasswordField);

        JButton btnUnlock = new StyledButton("DECRYPT & LOAD", COL_ACCENT);
        btnUnlock.addActionListener(e -> attemptUnlock());

        gbc.gridx = 0; gbc.gridy = 0; panel.add(title, gbc);
        gbc.gridy++; panel.add(subtitle, gbc);
        gbc.gridy++; panel.add(Box.createVerticalStrut(20), gbc);
        gbc.gridy++; panel.add(lblBlob, gbc);
        gbc.gridy++; panel.add(scrollBlob, gbc);
        gbc.gridy++; panel.add(lblPass, gbc);
        gbc.gridy++; panel.add(masterPasswordField, gbc);
        gbc.gridy++; panel.add(Box.createVerticalStrut(10), gbc);
        gbc.gridy++; panel.add(btnUnlock, gbc);
        return panel;
    }

    private JPanel createAppView() {
        JPanel panel = new JPanel(new BorderLayout());
        JPanel sidebar = new JPanel();
        sidebar.setLayout(new BoxLayout(sidebar, BoxLayout.Y_AXIS));
        sidebar.setBackground(COL_PANEL);
        sidebar.setBorder(new EmptyBorder(20, 20, 20, 20));
        sidebar.setPreferredSize(new Dimension(220, getHeight()));

        JLabel brand = new JLabel("BASTION");
        brand.setFont(FONT_TITLE);
        brand.setForeground(COL_TEXT);
        brand.setAlignmentX(Component.LEFT_ALIGNMENT);
        sidebar.add(brand);
        sidebar.add(Box.createVerticalStrut(40));

        JTabbedPane tabs = new JTabbedPane();
        styleTabs(tabs);

        addNavButton(sidebar, "LOGINS", tabs, 0);
        addNavButton(sidebar, "GENERATOR", tabs, 1);
        
        sidebar.add(Box.createVerticalGlue());
        JButton btnLock = new StyledButton("LOCK SYSTEM", COL_DANGER);
        btnLock.setAlignmentX(Component.LEFT_ALIGNMENT);
        btnLock.setMaximumSize(new Dimension(180, 40));
        btnLock.addActionListener(e -> lockSystem());
        sidebar.add(btnLock);

        tabs.addTab("LOGINS", createVaultTab());
        tabs.addTab("GENERATOR", createGeneratorTab());

        panel.add(sidebar, BorderLayout.WEST);
        panel.add(tabs, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createVaultTab() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(COL_BG);
        panel.setBorder(new EmptyBorder(20, 20, 20, 20));
        JPanel header = new JPanel(new BorderLayout());
        header.setBackground(COL_BG);
        JLabel title = new JLabel("Credentials");
        title.setFont(FONT_TITLE);
        title.setForeground(COL_TEXT);
        JTextField searchField = new JTextField();
        styleTextField(searchField);
        searchField.putClientProperty("JTextField.placeholderText", "Search...");
        searchField.setPreferredSize(new Dimension(200, 35));
        header.add(title, BorderLayout.WEST);
        header.add(searchField, BorderLayout.EAST);
        
        DefaultListModel<Map<String, Object>> listModel = new DefaultListModel<>();
        this.vaultListModel = listModel;
        JList<Map<String, Object>> list = new JList<>(listModel);
        list.setBackground(COL_BG);
        list.setForeground(COL_TEXT);
        list.setCellRenderer(new VaultCellRenderer());
        list.setFixedCellHeight(70);
        
        searchField.getDocument().addDocumentListener(new DocumentListener() {
            public void insertUpdate(DocumentEvent e) { filter(); }
            public void removeUpdate(DocumentEvent e) { filter(); }
            public void changedUpdate(DocumentEvent e) { filter(); }
            void filter() {
                String q = searchField.getText().toLowerCase();
                listModel.clear();
                for (Map<String, Object> c : vaultConfigs) {
                    String name = (String) c.getOrDefault("name", "Unknown");
                    String user = (String) c.getOrDefault("username", "");
                    if (name.toLowerCase().contains(q) || user.toLowerCase().contains(q)) {
                        listModel.addElement(c);
                    }
                }
            }
        });
        
        list.addMouseListener(new MouseAdapter() {
            public void mouseClicked(MouseEvent evt) {
                if (evt.getClickCount() == 2) {
                    int index = list.locationToIndex(evt.getPoint());
                    if (index >= 0) showPasswordDialog(listModel.getElementAt(index));
                }
            }
        });
        
        JScrollPane scroll = new JScrollPane(list);
        scroll.setBorder(new LineBorder(COL_BORDER));
        scroll.getViewport().setBackground(COL_BG);
        panel.add(header, BorderLayout.NORTH);
        panel.add(Box.createVerticalStrut(15), BorderLayout.CENTER);
        panel.add(scroll, BorderLayout.CENTER);
        return panel;
    }

    private JPanel createGeneratorTab() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBackground(COL_BG);
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;
        gbc.gridwidth = 2;
        JLabel title = new JLabel("Deterministic Generator");
        title.setFont(FONT_TITLE);
        title.setForeground(COL_TEXT);
        JTextField nameField = new JTextField(); styleTextField(nameField);
        JTextField userField = new JTextField(); styleTextField(userField);
        JTextField outField = new JTextField(); 
        styleTextField(outField);
        outField.setEditable(false);
        outField.setFont(new Font("Monospaced", Font.BOLD, 18));
        outField.setHorizontalAlignment(JTextField.CENTER);
        outField.setForeground(COL_SUCCESS);
        JButton btnGen = new StyledButton("GENERATE", COL_ACCENT);
        btnGen.addActionListener(e -> {
            try {
                String pass = ChaosEngine.transmute(masterEntropy, nameField.getText(), userField.getText(), 1, 16, true);
                outField.setText(pass);
            } catch (Exception ex) { outField.setText("ERROR"); }
        });
        JButton btnCopy = new StyledButton("COPY TO CLIPBOARD", COL_PANEL);
        btnCopy.setForeground(COL_TEXT);
        btnCopy.addActionListener(e -> {
            StringSelection sel = new StringSelection(outField.getText());
            Toolkit.getDefaultToolkit().getSystemClipboard().setContents(sel, sel);
            btnCopy.setText("COPIED!");
            javax.swing.Timer t = new javax.swing.Timer(1500, x -> btnCopy.setText("COPY TO CLIPBOARD"));
            t.setRepeats(false);
            t.start();
        });
        gbc.gridx = 0; gbc.gridy = 0; panel.add(title, gbc);
        gbc.gridwidth = 1;
        gbc.gridy++; panel.add(new JLabel("Service Name:") {{ setForeground(COL_TEXT_DIM); }}, gbc);
        gbc.gridx = 1; panel.add(nameField, gbc);
        gbc.gridx = 0; gbc.gridy++; panel.add(new JLabel("Username:") {{ setForeground(COL_TEXT_DIM); }}, gbc);
        gbc.gridx = 1; panel.add(userField, gbc);
        gbc.gridx = 0; gbc.gridy++; gbc.gridwidth = 2; panel.add(Box.createVerticalStrut(20), gbc);
        gbc.gridy++; panel.add(btnGen, gbc);
        gbc.gridy++; panel.add(Box.createVerticalStrut(10), gbc);
        gbc.gridy++; panel.add(outField, gbc);
        gbc.gridy++; panel.add(btnCopy, gbc);
        return panel;
    }

    private void attemptUnlock() {
        try {
            String blob = vaultBlobArea.getText().trim();
            String pass = new String(masterPasswordField.getPassword());
            if (blob.isEmpty() || pass.isEmpty()) return;

            String json = ChaosEngine.decryptVault(blob, pass);
            TinyJson parser = new TinyJson(json);
            Map<String, Object> root = (Map<String, Object>) parser.parse();

            masterEntropy = (String) root.get("entropy");
            
            // Core Configs
            List<Object> rawConfigs = (List<Object>) root.get("configs");
            vaultConfigs.clear();
            if (rawConfigs != null) {
                for (Object o : rawConfigs) vaultConfigs.add((Map<String, Object>) o);
            }
            
            // Populate Preservation Fields (Even if not used in GUI, we hold them)
            vaultNotes.clear();
            List<Object> rawNotes = (List<Object>) root.get("notes");
            if (rawNotes != null) {
                for (Object o : rawNotes) vaultNotes.add((Map<String, Object>) o);
            }
            
            vaultContacts.clear();
            List<Object> rawContacts = (List<Object>) root.get("contacts");
            if (rawContacts != null) {
                for (Object o : rawContacts) vaultContacts.add((Map<String, Object>) o);
            }
            
            lockerEntries.clear();
            List<Object> rawLocker = (List<Object>) root.get("locker");
            if (rawLocker != null) {
                for (Object o : rawLocker) lockerEntries.add((Map<String, Object>) o);
            }
            
            vaultIdentity = root.get("identity");
            vaultVersion = getInt(root.get("version"), 1);
            vaultFlags = getInt(root.get("flags"), 0);
            legacyOrigin = root.get("legacyOrigin");

            if (vaultListModel != null) {
                vaultListModel.clear();
                for (Map<String, Object> c : vaultConfigs) vaultListModel.addElement(c);
            }

            cardLayout.show(mainPanel, "APP");
            masterPasswordField.setText("");
            vaultBlobArea.setText("");
            
        } catch (Exception e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(this, "Decryption or Parsing Failed.\\nCheck console or verify password.", "Access Denied", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void showPasswordDialog(Map<String, Object> config) {
        JDialog d = new JDialog(this, "Credential Access", true);
        d.setSize(450, 280);
        d.setLocationRelativeTo(this);
        d.getContentPane().setBackground(COL_BG);
        d.setLayout(new GridBagLayout());
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.gridx = 0; gbc.gridy = 0;
        gbc.fill = GridBagConstraints.HORIZONTAL;
        String name = (String) config.get("name");
        String user = (String) config.get("username");
        JLabel lblName = new JLabel(name); lblName.setFont(FONT_TITLE); lblName.setForeground(COL_TEXT);
        JLabel lblUser = new JLabel(user); lblUser.setForeground(COL_TEXT_DIM);
        JTextField passField = new JTextField(); styleTextField(passField);
        passField.setHorizontalAlignment(JTextField.CENTER); passField.setEditable(false); passField.setFont(FONT_MONO);
        try {
            // Check for Custom Password
            if (config.containsKey("customPassword") && config.get("customPassword") != null && !((String)config.get("customPassword")).isEmpty()) {
                passField.setText((String) config.get("customPassword"));
            } else {
                int ver = getInt(config.get("version"), 1);
                int len = getInt(config.get("length"), 16);
                boolean sym = getBool(config.get("useSymbols"), true);
                String pwd = ChaosEngine.transmute(masterEntropy, name, user, ver, len, sym);
                passField.setText(pwd);
            }
        } catch (Exception e) { passField.setText("Error generating password"); e.printStackTrace(); }
        JButton btnCopy = new StyledButton("COPY PASSWORD", COL_SUCCESS);
        btnCopy.addActionListener(e -> {
            StringSelection sel = new StringSelection(passField.getText());
            Toolkit.getDefaultToolkit().getSystemClipboard().setContents(sel, sel);
            d.dispose();
        });
        d.add(lblName, gbc); gbc.gridy++; d.add(lblUser, gbc);
        gbc.gridy++; d.add(passField, gbc); gbc.gridy++; d.add(btnCopy, gbc);
        d.setVisible(true);
    }

    private static int getInt(Object obj, int def) { if (obj instanceof Number) return ((Number) obj).intValue(); return def; }
    private static boolean getBool(Object obj, boolean def) { if (obj instanceof Boolean) return (Boolean) obj; return def; }
    private void lockSystem() {
        masterEntropy = null; vaultConfigs.clear(); vaultNotes.clear(); vaultContacts.clear(); lockerEntries.clear();
        vaultIdentity = null;
        if (vaultListModel != null) vaultListModel.clear();
        cardLayout.show(mainPanel, "AUTH");
    }
    private void addNavButton(JPanel sidebar, String title, JTabbedPane tabs, int index) {
        JButton btn = new JButton(title);
        btn.setAlignmentX(Component.LEFT_ALIGNMENT);
        btn.setMaximumSize(new Dimension(180, 40));
        btn.setForeground(COL_TEXT_DIM);
        btn.setBackground(COL_PANEL);
        btn.setBorderPainted(false); btn.setFocusPainted(false); btn.setContentAreaFilled(false);
        btn.setFont(new Font("SansSerif", Font.BOLD, 12));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.addActionListener(e -> tabs.setSelectedIndex(index));
        sidebar.add(btn); sidebar.add(Box.createVerticalStrut(10));
    }
    private void styleTextField(JTextField tf) {
        tf.setBackground(COL_PANEL); tf.setForeground(COL_TEXT); tf.setCaretColor(COL_ACCENT);
        tf.setBorder(BorderFactory.createCompoundBorder(new LineBorder(COL_BORDER), new EmptyBorder(5, 10, 5, 10)));
    }
    private void styleTextArea(JTextArea ta) {
        ta.setBackground(COL_PANEL); ta.setForeground(COL_TEXT); ta.setCaretColor(COL_ACCENT);
        ta.setLineWrap(true); ta.setBorder(new EmptyBorder(5, 5, 5, 5));
    }
    private void styleTabs(JTabbedPane tabs) {
        tabs.setUI(new javax.swing.plaf.basic.BasicTabbedPaneUI() {
            protected void installDefaults() { super.installDefaults(); }
            protected int calculateTabAreaHeight(int tabPlacement, int horizRunCount, int maxTabHeight) { return 0; }
        });
    }
    class StyledButton extends JButton {
        private Color baseColor;
        public StyledButton(String text, Color bg) { super(text); this.baseColor = bg; setContentAreaFilled(false); setFocusPainted(false); setBorderPainted(false); setForeground(Color.WHITE); setFont(new Font("SansSerif", Font.BOLD, 12)); setCursor(new Cursor(Cursor.HAND_CURSOR)); }
        @Override protected void paintComponent(Graphics g) {
            Graphics2D g2 = (Graphics2D) g.create();
            g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            if (getModel().isPressed()) g2.setColor(baseColor.darker()); else if (getModel().isRollover()) g2.setColor(baseColor.brighter()); else g2.setColor(baseColor);
            g2.fillRoundRect(0, 0, getWidth(), getHeight(), 10, 10); g2.dispose(); super.paintComponent(g);
        }
    }
    class VaultCellRenderer extends JPanel implements ListCellRenderer<Map<String, Object>> {
        private JLabel name = new JLabel(); private JLabel user = new JLabel(); private JLabel icon = new JLabel();
        public VaultCellRenderer() {
            setLayout(new BorderLayout(10, 0)); setBorder(new EmptyBorder(10, 15, 10, 15)); setBackground(COL_BG);
            JPanel textPanel = new JPanel(new GridLayout(2, 1)); textPanel.setOpaque(false);
            name.setFont(new Font("SansSerif", Font.BOLD, 16)); name.setForeground(COL_TEXT);
            user.setFont(new Font("Monospaced", Font.PLAIN, 12)); user.setForeground(COL_TEXT_DIM);
            icon.setForeground(COL_ACCENT); icon.setFont(new Font("Monospaced", Font.BOLD, 20));
            icon.setPreferredSize(new Dimension(40, 40)); icon.setHorizontalAlignment(SwingConstants.CENTER); icon.setBorder(new LineBorder(COL_BORDER));
            textPanel.add(name); textPanel.add(user); add(icon, BorderLayout.WEST); add(textPanel, BorderLayout.CENTER);
        }
        @Override public Component getListCellRendererComponent(JList<? extends Map<String, Object>> list, Map<String, Object> value, int index, boolean isSelected, boolean cellHasFocus) {
            String n = (String) value.getOrDefault("name", "?"); name.setText(n); user.setText((String) value.getOrDefault("username", "")); icon.setText(n.isEmpty() ? "?" : n.substring(0, 1).toUpperCase());
            if (isSelected) { setBackground(COL_PANEL); icon.setBorder(new LineBorder(COL_ACCENT)); } else { setBackground(COL_BG); icon.setBorder(new LineBorder(COL_BORDER)); }
            return this;
        }
    }

    private static final int ITERATIONS = 210_000;
    private static final int GCM_TAG_LENGTH = 128;
    private static final int GCM_IV_LENGTH = 12;
    private static final byte[] MAGIC_BYTES = "BASTION1".getBytes(StandardCharsets.UTF_8);

    static class ChaosEngine {
        public static String decryptVault(String blobB64, String password) throws Exception {
            byte[] data = Base64.getDecoder().decode(blobB64);
            int offset = 0;
            if (data.length > 5 && data[0] == 0x42 && data[1] == 0x53 && data[2] == 0x54 && data[3] == 0x4E) {
                offset = 5; 
            }
            if (data.length < 28 + offset) throw new IllegalArgumentException("Invalid blob");
            byte[] salt = Arrays.copyOfRange(data, offset, offset + 16);
            byte[] iv = Arrays.copyOfRange(data, offset + 16, offset + 28);
            byte[] ciphertext = Arrays.copyOfRange(data, offset + 28, data.length);
            SecretKey key = deriveKey(password, salt);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] plaintext = cipher.doFinal(ciphertext);
            if (plaintext.length > 4) {
                ByteBuffer bb = ByteBuffer.wrap(plaintext);
                bb.order(ByteOrder.LITTLE_ENDIAN);
                long len = Integer.toUnsignedLong(bb.getInt());
                if (len <= plaintext.length - 4) {
                    byte[] payload = Arrays.copyOfRange(plaintext, 4, 4 + (int)len);
                    return new String(payload, StandardCharsets.UTF_8);
                }
            }
            return new String(plaintext, StandardCharsets.UTF_8);
        }

        public static String encryptVault(String json, String password) throws Exception {
            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);
            byte[] iv = new byte[12];
            new SecureRandom().nextBytes(iv);
            SecretKey key = deriveKey(password, salt);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            
            byte[] data = json.getBytes(StandardCharsets.UTF_8);
            // Framing V3.5: [LEN 4B] [DATA] [PAD]
            int len = data.length;
            int total = 4 + len;
            int pad = (64 - (total % 64)) % 64;
            ByteBuffer buf = ByteBuffer.allocate(total + pad);
            buf.order(ByteOrder.LITTLE_ENDIAN);
            buf.putInt(len);
            buf.put(data);
            while(buf.hasRemaining()) buf.put((byte)0);
            
            byte[] ciphertext = cipher.doFinal(buf.array());
            
            // Header BSTN + 0x02 (Java Fallback Compat)
            // We use V2 header because standard Java 8 doesn't have Argon2.
            // The web client will read this as V2 and upgrade it later.
            byte[] header = new byte[]{0x42, 0x53, 0x54, 0x4E, 0x02};
            
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            bos.write(header);
            bos.write(salt);
            bos.write(iv);
            bos.write(ciphertext);
            
            return Base64.getEncoder().encodeToString(bos.toByteArray());
        }

        private static SecretKey deriveKey(String password, byte[] salt) throws Exception {
            // PBKDF2-HMAC-SHA256 (Compatible with V2 Protocol)
            byte[] domain = "BASTION_VAULT_V1::".getBytes(StandardCharsets.UTF_8);
            byte[] finalSalt = new byte[domain.length + salt.length];
            System.arraycopy(domain, 0, finalSalt, 0, domain.length);
            System.arraycopy(salt, 0, finalSalt, domain.length, salt.length);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            KeySpec spec = new PBEKeySpec(password.toCharArray(), finalSalt, ITERATIONS, 256);
            return new SecretKeySpec(factory.generateSecret(spec).getEncoded(), "AES");
        }

        public static String transmute(String entropyHex, String name, String username, int version, int length, boolean useSymbols) throws Exception {
            String salt = "BASTION_GENERATOR_V2::" + name.toLowerCase() + "::" + username.toLowerCase() + "::v" + version;
            int dkLen = length * 32; 
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512");
            KeySpec spec = new PBEKeySpec(entropyHex.toCharArray(), salt.getBytes(StandardCharsets.UTF_8), ITERATIONS, dkLen);
            byte[] buffer = factory.generateSecret(spec).getEncoded();
            String alpha = "abcdefghijklmnopqrstuvwxyz"; String caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; String num = "0123456789"; String sym = "!@#$%^&*()_+-=[]{}|;:,.<>?";
            String pool = alpha + caps + num + (useSymbols ? sym : "");
            int limit = 256 - (256 % pool.length());
            StringBuilder out = new StringBuilder(); int i = 0;
            while(out.length() < length && i < buffer.length) {
                int b = Byte.toUnsignedInt(buffer[i++]);
                if (b < limit) out.append(pool.charAt(b % pool.length()));
            }
            return out.toString();
        }
    }

    static class JsonWriter {
        public static String toJson(Map<String, Object> map) {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            boolean first = true;
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (!first) sb.append(",");
                sb.append("\\"").append(entry.getKey()).append("\\":");
                Object val = entry.getValue();
                if (val instanceof String) sb.append("\\"").append(escape((String)val)).append("\\"");
                else if (val instanceof Number || val instanceof Boolean) sb.append(val);
                else if (val instanceof List) sb.append(toJsonList((List)val));
                else sb.append("null");
                first = false;
            }
            sb.append("}");
            return sb.toString();
        }
        private static String toJsonList(List list) {
            StringBuilder sb = new StringBuilder();
            sb.append("[");
            boolean first = true;
            for (Object o : list) {
                if (!first) sb.append(",");
                if (o instanceof Map) sb.append(toJson((Map)o));
                else if (o instanceof String) sb.append("\\"").append(escape((String)o)).append("\\"");
                else sb.append(o);
                first = false;
            }
            sb.append("]");
            return sb.toString();
        }
        private static String escape(String s) {
            if (s == null) return "";
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < s.length(); i++) {
                char c = s.charAt(i);
                if (c == '\\"') sb.append("\\\\\\"");
                else if (c == '\\\\') sb.append("\\\\\\\\");
                else if (c == '\\b') sb.append("\\\\b");
                else if (c == '\\f') sb.append("\\\\f");
                else if (c == '\\n') sb.append("\\\\n");
                else if (c == '\\r') sb.append("\\\\r");
                else if (c == '\\t') sb.append("\\\\t");
                else if (c < 32) {
                    sb.append(String.format("\\\\u%04x", (int)c));
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }
    }

    static class TinyJson {
        private String json; private int pos;
        public TinyJson(String json) { this.json = json; this.pos = 0; }
        public Object parse() {
            skipWhite(); if (pos >= json.length()) return null; char c = json.charAt(pos); if (c == '{') return parseObject(); if (c == '[') return parseArray(); if (c == '"') return parseString(); if (c == 't') { pos += 4; return true; } if (c == 'f') { pos += 5; return false; } if (c == 'n') { pos += 4; return null; } return parseNumber();
        }
        private Map<String, Object> parseObject() {
            Map<String, Object> map = new HashMap<>(); consume('{'); skipWhite(); if (peek() == '}') { consume('}'); return map; }
            while (true) { String key = parseString(); skipWhite(); consume(':'); Object val = parse(); map.put(key, val); skipWhite(); if (peek() == '}') { consume('}'); break; } consume(','); skipWhite(); } return map;
        }
        private List<Object> parseArray() {
            List<Object> list = new ArrayList<>(); consume('['); skipWhite(); if (peek() == ']') { consume(']'); return list; }
            while (true) { list.add(parse()); skipWhite(); if (peek() == ']') { consume(']'); break; } consume(','); skipWhite(); } return list;
        }
        private String parseString() {
            consume('"');
            StringBuilder sb = new StringBuilder();
            while (true) {
                char c = json.charAt(pos++);
                if (c == '"') break;
                if (c == '\\\\') {
                    char next = json.charAt(pos++);
                    switch (next) {
                        case '"': sb.append('"'); break;
                        case '\\\\': sb.append('\\\\'); break;
                        case '/': sb.append('/'); break;
                        case 'b': sb.append('\\\\b'); break;
                        case 'f': sb.append('\\\\f'); break;
                        case 'n': sb.append('\\\\n'); break;
                        case 'r': sb.append('\\\\r'); break;
                        case 't': sb.append('\\\\t'); break;
                        case 'u':
                            String hex = json.substring(pos, pos + 4);
                            pos += 4;
                            sb.append((char) Integer.parseInt(hex, 16));
                            break;
                    }
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }
        private Number parseNumber() {
            int start = pos; while (pos < json.length()) { char c = json.charAt(pos); if (c == '-' || c == '+' || c == '.' || c == 'e' || c == 'E' || Character.isDigit(c)) { pos++; } else { break; } } String numStr = json.substring(start, pos); if (numStr.contains(".") || numStr.contains("e") || numStr.contains("E")) { return Double.parseDouble(numStr); } return Long.parseLong(numStr);
        }
        private void skipWhite() { while (pos < json.length() && Character.isWhitespace(json.charAt(pos))) pos++; } private char peek() { return json.charAt(pos); } private void consume(char expected) { if (json.charAt(pos) != expected) throw new RuntimeException("Expected " + expected + " at " + pos); pos++; }
    }
}
`;
