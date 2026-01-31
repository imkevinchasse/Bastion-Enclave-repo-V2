#!/bin/bash

# BASTION ENCLAVE INSTALLER
# Sets up ~/.bastion with a python virtual environment and global alias.

set -e

INSTALL_DIR="$HOME/.bastion"
USER_BIN="$HOME/.local/bin"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo -e "\033[0;34m[+] Bastion Enclave Installer\033[0m"

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "\033[0;31m[!] Python 3 not found. Please install python3 first.\033[0m"
    exit 1
fi

# 2. Setup Directory & Copy Files
echo "[*] Installing to $INSTALL_DIR..."
# Remove existing install to ensure clean state
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Copy contents from the script directory to the install directory
# This ensures src/, bastion.py, and requirements.txt are present
cp -R "$SCRIPT_DIR/"* "$INSTALL_DIR/" 2>/dev/null || true

cd "$INSTALL_DIR"

# 3. Setup Virtual Environment
echo "[*] Initializing Virtual Environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# 4. Install Dependencies
echo "[*] Installing Dependencies..."
if [ -f "requirements.txt" ]; then
    ./venv/bin/pip install -r requirements.txt --quiet
else
    echo "[!] Warning: requirements.txt not found in source."
fi

# 5. Make Executable
# Ensure the python script can be run directly
chmod +x bastion.py

# 6. Create Wrapper
echo "[*] Creating 'bastion' executable wrapper..."
cat <<EOF > bastion_wrapper
#!/bin/bash
# Activate the isolated virtual environment and run the application
source "$INSTALL_DIR/venv/bin/activate"
exec python3 "$INSTALL_DIR/bastion.py" "\$@"
EOF

chmod +x bastion_wrapper

# 7. Link to User Path
mkdir -p "$USER_BIN"

# Remove old link/file if exists to prevent conflicts
if [ -L "$USER_BIN/bastion" ] || [ -f "$USER_BIN/bastion" ]; then
    rm -f "$USER_BIN/bastion"
fi

echo "[*] Linking to $USER_BIN/bastion..."
ln -s "$INSTALL_DIR/bastion_wrapper" "$USER_BIN/bastion"

# 8. Success & Path Check
echo -e "\033[0;32m[✓] Install Complete.\033[0m"

if [[ ":$PATH:" == *":$USER_BIN:"* ]]; then
    echo -e "You can now type \033[1mbastion\033[0m to launch the enclave."
else
    echo -e "\033[0;33m[!] Warning: $USER_BIN is not currently in your PATH.\033[0m"
    echo "To run 'bastion', add this to your shell profile (e.g. ~/.bashrc, ~/.zshrc):"
    echo ""
    echo "  export PATH=\"\$PATH:$USER_BIN\""
    echo ""
    echo "Then restart your terminal and type 'bastion'."
fi
