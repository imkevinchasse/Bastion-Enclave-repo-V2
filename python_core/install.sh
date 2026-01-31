#!/bin/bash

# BASTION ENCLAVE INSTALLER
# Sets up ~/.bastion with a python virtual environment and global alias.

set -e

INSTALL_DIR="$HOME/.bastion"
USER_BIN="$HOME/.local/bin"
REPO_ZIP_URL="https://github.com/imkevinchasse/Bastion-Enclave-repo-V2/archive/refs/heads/main.zip"

echo -e "\033[0;34m[+] Bastion Enclave Installer\033[0m"

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "\033[0;31m[!] Python 3 not found. Please install python3 first.\033[0m"
    exit 1
fi

# 2. Setup Directory
echo "[*] Cleaning target $INSTALL_DIR..."
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# 3. Resolve Source Files
# Check if we are running from a local folder with files (Zip download) or via Pipe (Curl)
SOURCE_DIR=""
if [ -n "${BASH_SOURCE[0]}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
    # Script exists on disk, get its directory
    SOURCE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
fi

if [ -n "$SOURCE_DIR" ] && [ -f "$SOURCE_DIR/bastion.py" ]; then
    echo "[*] Installing from local source..."
    cp -R "$SOURCE_DIR/"* "$INSTALL_DIR/"
else
    echo "[*] Downloading core files from remote repository..."
    
    # Check for unzip
    if ! command -v unzip &> /dev/null; then
        echo -e "\033[0;31m[!] 'unzip' is required for web installation. Please install it.\033[0m"
        exit 1
    fi

    # Create Temp
    TEMP_DIR=$(mktemp -d)
    
    # Download Repo
    echo "    - Fetching $REPO_ZIP_URL"
    curl -L -o "$TEMP_DIR/repo.zip" "$REPO_ZIP_URL"
    
    # Extract
    echo "    - Extracting archive..."
    unzip -q "$TEMP_DIR/repo.zip" -d "$TEMP_DIR"
    
    # Find the python_core directory inside the extracted repo (depth agnostic)
    # We look for 'bastion.py' to ensure we have the right folder
    FOUND_SRC=$(find "$TEMP_DIR" -name "bastion.py" -type f | head -n 1)
    
    if [ -z "$FOUND_SRC" ]; then
        echo -e "\033[0;31m[!] Error: Integrity check failed. 'bastion.py' not found in download.\033[0m"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    SRC_ROOT=$(dirname "$FOUND_SRC")
    
    # Move files to install dir
    cp -R "$SRC_ROOT/"* "$INSTALL_DIR/"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
fi

cd "$INSTALL_DIR"

# 4. Setup Virtual Environment
echo "[*] Initializing Virtual Environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# 5. Install Dependencies
echo "[*] Installing Dependencies..."
if [ -f "requirements.txt" ]; then
    ./venv/bin/pip install -r requirements.txt --quiet
else
    echo "[!] Warning: requirements.txt not found."
fi

# 6. Make Executable
chmod +x bastion.py

# 7. Create Wrapper
echo "[*] Creating 'bastion' executable wrapper..."
cat <<EOF > bastion_wrapper
#!/bin/bash
# Activate the isolated virtual environment and run the application
source "$INSTALL_DIR/venv/bin/activate"
exec python3 "$INSTALL_DIR/bastion.py" "\$@"
EOF

chmod +x bastion_wrapper

# 8. Link to User Path
mkdir -p "$USER_BIN"

# Remove old link/file if exists
if [ -L "$USER_BIN/bastion" ] || [ -f "$USER_BIN/bastion" ]; then
    rm -f "$USER_BIN/bastion"
fi

echo "[*] Linking to $USER_BIN/bastion..."
ln -s "$INSTALL_DIR/bastion_wrapper" "$USER_BIN/bastion"

# 9. Success & Path Check
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
