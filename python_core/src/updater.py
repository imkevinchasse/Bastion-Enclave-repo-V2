import os
import sys
import subprocess
import requests
from rich.console import Console

REPO_URL = "https://raw.githubusercontent.com/imkevinchasse/Bastion-Enclave-repo-V2/main/python_core"

class BastionUpdater:
    def __init__(self):
        self.console = Console()

    def perform_update(self, force=False):
        self.console.print("[bold cyan]Bastion Enclave Update System[/bold cyan]")
        
        install_dir = os.path.expanduser("~/.bastion")
        if not os.path.exists(install_dir):
            self.console.print("[yellow]Standard installation directory (~/.bastion) not found.[/yellow]")
            return

        try:
            installer_url = f"{REPO_URL}/install.sh"
            self.console.print(f"Fetching installer from {installer_url}...")
            
            r = requests.get(installer_url)
            if r.status_code != 200:
                self.console.print("[red]Failed to download update script.[/red]")
                return

            self.console.print("[green]Applying patches...[/green]")
            process = subprocess.Popen(
                ['bash'], 
                stdin=subprocess.PIPE, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=r.text)
            
            if process.returncode == 0:
                self.console.print("\n[bold green]✓ Update Successful[/bold green]")
                self.console.print("[dim]Restarting Bastion...[/dim]")
                
                # Auto-restart logic
                # We assume the user is running via the 'bastion' global command or the wrapper.
                # The standard install location is ~/.local/bin/bastion
                executable = os.path.expanduser("~/.local/bin/bastion")
                
                if os.path.exists(executable):
                    try:
                        # Replace current process with new instance
                        os.execv(executable, [executable])
                    except OSError:
                        self.console.print("[yellow]Auto-restart failed. Please run 'bastion' manually.[/yellow]")
                else:
                    self.console.print("Please restart your shell to use the new version.")
            else:
                self.console.print(f"[red]Update failed:[/red]\n{stderr}")

        except Exception as e:
            self.console.print(f"[red]Error during update: {e}[/red]")
