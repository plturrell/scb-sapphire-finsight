#!/usr/bin/env python3
"""
Distributed Computing Coordinator for Monte Carlo Simulations
Manages multi-node execution across server clusters
"""

import os
import sys
import time
import json
import socket
import argparse
import logging
import threading
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple, Union
import numpy as np
import uuid
import tempfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("distributed_coordinator.log")
    ]
)
logger = logging.getLogger("DistributedCoordinator")

class DistributedNode:
    """Represents a computational node in the distributed cluster"""
    
    def __init__(
        self,
        node_id: str,
        hostname: str,
        port: int,
        num_gpus: int = 0,
        cpu_cores: int = 0,
        memory_gb: float = 0.0,
        username: Optional[str] = None,
        ssh_key_path: Optional[str] = None
    ):
        """
        Initialize a distributed node
        
        Args:
            node_id: Unique identifier for the node
            hostname: Hostname or IP address
            port: SSH port number
            num_gpus: Number of GPUs available (0 for CPU-only node)
            cpu_cores: Number of CPU cores
            memory_gb: Available memory in GB
            username: SSH username (optional)
            ssh_key_path: Path to SSH private key file (optional)
        """
        self.node_id = node_id
        self.hostname = hostname
        self.port = port
        self.num_gpus = num_gpus
        self.cpu_cores = cpu_cores
        self.memory_gb = memory_gb
        self.username = username or os.environ.get("USER", None)
        self.ssh_key_path = ssh_key_path
        
        # Node state tracking
        self.status = "initialized"  # initialized, active, busy, error
        self.current_job = None
        self.last_heartbeat = 0.0
        self.connected = False
        self.performance_metrics = {}
    
    def __str__(self) -> str:
        """String representation"""
        return f"Node({self.node_id}, {self.hostname}:{self.port}, GPUs: {self.num_gpus})"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "node_id": self.node_id,
            "hostname": self.hostname,
            "port": self.port,
            "num_gpus": self.num_gpus,
            "cpu_cores": self.cpu_cores,
            "memory_gb": self.memory_gb,
            "username": self.username,
            "status": self.status,
            "connected": self.connected,
            "last_heartbeat": self.last_heartbeat,
            "current_job": self.current_job
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DistributedNode':
        """Create from dictionary"""
        node = cls(
            node_id=data["node_id"],
            hostname=data["hostname"],
            port=data["port"],
            num_gpus=data.get("num_gpus", 0),
            cpu_cores=data.get("cpu_cores", 0),
            memory_gb=data.get("memory_gb", 0.0),
            username=data.get("username", None),
            ssh_key_path=data.get("ssh_key_path", None)
        )
        node.status = data.get("status", "initialized")
        node.connected = data.get("connected", False)
        node.last_heartbeat = data.get("last_heartbeat", 0.0)
        node.current_job = data.get("current_job", None)
        return node
    
    def build_ssh_command(self, cmd: str) -> List[str]:
        """Build an SSH command to execute on this node"""
        ssh_cmd = ["ssh"]
        
        # Add SSH options
        ssh_cmd.extend([
            "-o", "StrictHostKeyChecking=no",
            "-o", "BatchMode=yes",
            "-o", "ConnectTimeout=10"
        ])
        
        # Add port if non-standard
        if self.port != 22:
            ssh_cmd.extend(["-p", str(self.port)])
        
        # Add identity file if specified
        if self.ssh_key_path:
            ssh_cmd.extend(["-i", self.ssh_key_path])
        
        # Add host target
        target = self.hostname
        if self.username:
            target = f"{self.username}@{self.hostname}"
        ssh_cmd.append(target)
        
        # Add command to execute
        ssh_cmd.append(cmd)
        
        return ssh_cmd
    
    def execute_command(self, cmd: str) -> Tuple[int, str, str]:
        """
        Execute command on the node via SSH
        
        Args:
            cmd: Command to execute
            
        Returns:
            Tuple of (return_code, stdout, stderr)
        """
        ssh_cmd = self.build_ssh_command(cmd)
        
        logger.debug(f"Executing on {self.node_id}: {' '.join(ssh_cmd)}")
        
        process = subprocess.Popen(
            ssh_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        
        stdout, stderr = process.communicate()
        return_code = process.returncode
        
        if return_code != 0:
            logger.warning(f"Command failed on {self.node_id}: {stderr}")
        
        return return_code, stdout, stderr
    
    def check_connection(self) -> bool:
        """Check if node is reachable"""
        try:
            # Simple ping test
            return_code, stdout, stderr = self.execute_command("echo 'ping'")
            self.connected = return_code == 0
            
            if self.connected:
                self.last_heartbeat = time.time()
                
            return self.connected
        except Exception as e:
            logger.error(f"Error checking connection to {self.node_id}: {e}")
            self.connected = False
            return False
    
    def initialize_node(self, setup_script_path: Optional[str] = None) -> bool:
        """
        Initialize the node for Monte Carlo simulations
        
        Args:
            setup_script_path: Path to setup script to run on node
            
        Returns:
            True if initialization successful
        """
        try:
            # Check connection first
            if not self.check_connection():
                logger.error(f"Cannot initialize {self.node_id}: connection failed")
                return False
            
            # Create remote directory for simulation
            self.execute_command("mkdir -p ~/monte_carlo_simulations")
            
            # Run setup script if provided
            if setup_script_path and os.path.exists(setup_script_path):
                # Copy script to remote node
                scp_cmd = ["scp"]
                
                # Add SSH options
                if self.port != 22:
                    scp_cmd.extend(["-P", str(self.port)])
                
                if self.ssh_key_path:
                    scp_cmd.extend(["-i", self.ssh_key_path])
                
                scp_cmd.extend([
                    setup_script_path,
                    f"{self.username if self.username else ''}{'@' if self.username else ''}{self.hostname}:~/monte_carlo_simulations/setup.sh"
                ])
                
                subprocess.run(scp_cmd, check=True)
                
                # Execute remote setup script
                return_code, stdout, stderr = self.execute_command("cd ~/monte_carlo_simulations && chmod +x setup.sh && ./setup.sh")
                
                if return_code != 0:
                    logger.error(f"Setup script failed on {self.node_id}: {stderr}")
                    return False
            
            # Verify Python and required packages
            return_code, stdout, stderr = self.execute_command("python3 -c 'import torch, numpy; print(f\"PyTorch: {torch.__version__}, CUDA: {torch.cuda.is_available()}\")'")
            
            if return_code != 0:
                logger.error(f"Python environment check failed on {self.node_id}: {stderr}")
                return False
            
            logger.info(f"Node {self.node_id} initialized successfully: {stdout.strip()}")
            self.status = "active"
            return True
            
        except Exception as e:
            logger.error(f"Error initializing node {self.node_id}: {e}")
            self.status = "error"
            return False
    
    def get_system_info(self) -> Dict[str, Any]:
        """Get system information from the node"""
        try:
            # Get GPU information if available
            if self.num_gpus > 0:
                return_code, stdout, stderr = self.execute_command("nvidia-smi --query-gpu=name,memory.total,memory.free,utilization.gpu --format=csv,noheader,nounits")
                
                if return_code == 0:
                    gpu_info = []
                    for line in stdout.strip().split('\n'):
                        if line.strip():
                            parts = [p.strip() for p in line.split(',')]
                            if len(parts) >= 4:
                                gpu_info.append({
                                    "name": parts[0],
                                    "memory_total_mb": int(parts[1]),
                                    "memory_free_mb": int(parts[2]),
                                    "utilization_pct": int(parts[3])
                                })
                else:
                    gpu_info = []
            else:
                gpu_info = []
            
            # Get CPU and memory information
            return_code, stdout, stderr = self.execute_command("cat /proc/cpuinfo | grep -c processor; free -m | grep Mem")
            
            if return_code == 0:
                lines = stdout.strip().split('\n')
                if len(lines) >= 2:
                    cpu_count = int(lines[0].strip())
                    memory_parts = lines[1].split()
                    memory_total = int(memory_parts[1]) if len(memory_parts) > 1 else 0
                    memory_free = int(memory_parts[6]) if len(memory_parts) > 6 else 0
                else:
                    cpu_count = 0
                    memory_total = 0
                    memory_free = 0
            else:
                cpu_count = 0
                memory_total = 0
                memory_free = 0
            
            # Update node properties
            self.cpu_cores = cpu_count
            self.memory_gb = memory_total / 1024  # Convert MB to GB
            
            return {
                "cpu": {
                    "cores": cpu_count,
                },
                "memory": {
                    "total_mb": memory_total,
                    "free_mb": memory_free
                },
                "gpus": gpu_info
            }
            
        except Exception as e:
            logger.error(f"Error getting system info from {self.node_id}: {e}")
            return {}

class DistributedCoordinator:
    """
    Coordinator for distributed Monte Carlo simulations
    Manages multiple nodes and distributes workload
    """
    
    def __init__(
        self,
        config_path: Optional[str] = None,
        storage_dir: Optional[str] = None
    ):
        """
        Initialize the distributed coordinator
        
        Args:
            config_path: Path to configuration file
            storage_dir: Directory for storing results and state
        """
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Set up storage
        self.storage_dir = storage_dir or Path.home() / ".monte_carlo_distributed"
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize nodes
        self.nodes = {}
        self._load_nodes()
        
        # Job tracking
        self.active_jobs = {}
        self.completed_jobs = {}
        self._load_jobs()
        
        # Start background threads
        self.shutdown_flag = False
        self.monitor_thread = threading.Thread(target=self._monitor_nodes, daemon=True)
        self.monitor_thread.start()
        
        logger.info(f"Distributed coordinator started with {len(self.nodes)} nodes")
    
    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load configuration from file or use defaults"""
        default_config = {
            "coordinator": {
                "auto_discovery": False,
                "discovery_ports": [22, 2222],
                "heartbeat_interval": 60,
                "job_check_interval": 30
            },
            "simulation": {
                "default_batch_size": 100000,
                "checkpoint_interval": 1000000,
                "result_format": "json"
            },
            "ssh": {
                "default_username": os.environ.get("USER", None),
                "default_key_path": os.path.expanduser("~/.ssh/id_rsa"),
                "connection_timeout": 10
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                
                # Merge with defaults (shallow merge at top level)
                merged_config = default_config.copy()
                for key, value in user_config.items():
                    if key in merged_config and isinstance(merged_config[key], dict) and isinstance(value, dict):
                        merged_config[key].update(value)
                    else:
                        merged_config[key] = value
                
                return merged_config
            except Exception as e:
                logger.error(f"Error loading config from {config_path}: {e}")
                return default_config
        else:
            return default_config
    
    def _load_nodes(self) -> None:
        """Load nodes from state file"""
        nodes_file = self.storage_dir / "nodes.json"
        
        if os.path.exists(nodes_file):
            try:
                with open(nodes_file, 'r') as f:
                    nodes_data = json.load(f)
                
                for node_data in nodes_data:
                    node = DistributedNode.from_dict(node_data)
                    self.nodes[node.node_id] = node
                    
                logger.info(f"Loaded {len(self.nodes)} nodes from {nodes_file}")
            except Exception as e:
                logger.error(f"Error loading nodes from {nodes_file}: {e}")
    
    def _save_nodes(self) -> None:
        """Save nodes to state file"""
        nodes_file = self.storage_dir / "nodes.json"
        
        try:
            nodes_data = [node.to_dict() for node in self.nodes.values()]
            
            with open(nodes_file, 'w') as f:
                json.dump(nodes_data, f, indent=2)
                
            logger.debug(f"Saved {len(self.nodes)} nodes to {nodes_file}")
        except Exception as e:
            logger.error(f"Error saving nodes to {nodes_file}: {e}")
    
    def _load_jobs(self) -> None:
        """Load job status from state file"""
        jobs_file = self.storage_dir / "jobs.json"
        
        if os.path.exists(jobs_file):
            try:
                with open(jobs_file, 'r') as f:
                    jobs_data = json.load(f)
                
                self.active_jobs = jobs_data.get("active", {})
                self.completed_jobs = jobs_data.get("completed", {})
                    
                logger.info(f"Loaded {len(self.active_jobs)} active jobs and {len(self.completed_jobs)} completed jobs from {jobs_file}")
            except Exception as e:
                logger.error(f"Error loading jobs from {jobs_file}: {e}")
    
    def _save_jobs(self) -> None:
        """Save job status to state file"""
        jobs_file = self.storage_dir / "jobs.json"
        
        try:
            jobs_data = {
                "active": self.active_jobs,
                "completed": self.completed_jobs
            }
            
            with open(jobs_file, 'w') as f:
                json.dump(jobs_data, f, indent=2)
                
            logger.debug(f"Saved {len(self.active_jobs)} active jobs and {len(self.completed_jobs)} completed jobs to {jobs_file}")
        except Exception as e:
            logger.error(f"Error saving jobs to {jobs_file}: {e}")
    
    def add_node(
        self,
        hostname: str,
        port: int = 22,
        num_gpus: int = 0,
        username: Optional[str] = None,
        ssh_key_path: Optional[str] = None,
        initialize: bool = True,
        setup_script_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Add a new computation node
        
        Args:
            hostname: Hostname or IP address
            port: SSH port (default: 22)
            num_gpus: Number of GPUs (default: 0 for auto-detect)
            username: SSH username (default: from config)
            ssh_key_path: SSH key path (default: from config)
            initialize: Whether to initialize the node
            setup_script_path: Path to setup script
            
        Returns:
            Node ID if successful, None if failed
        """
        # Generate unique node ID
        node_id = f"node_{uuid.uuid4().hex[:8]}"
        
        # Use defaults from config if not specified
        if username is None:
            username = self.config["ssh"]["default_username"]
        
        if ssh_key_path is None:
            ssh_key_path = self.config["ssh"]["default_key_path"]
        
        # Create node
        node = DistributedNode(
            node_id=node_id,
            hostname=hostname,
            port=port,
            num_gpus=num_gpus,
            username=username,
            ssh_key_path=ssh_key_path
        )
        
        # Check connection before adding
        if not node.check_connection():
            logger.error(f"Cannot add node {hostname}:{port}: connection failed")
            return None
        
        # Initialize if requested
        if initialize:
            if not node.initialize_node(setup_script_path):
                logger.error(f"Failed to initialize node {hostname}:{port}")
                return None
            
            # Get system info after initialization
            node.get_system_info()
        
        # Add to nodes collection
        self.nodes[node_id] = node
        
        # Save nodes to state file
        self._save_nodes()
        
        logger.info(f"Added node {node_id} ({hostname}:{port}) with {node.num_gpus} GPUs")
        return node_id
    
    def remove_node(self, node_id: str) -> bool:
        """
        Remove a node
        
        Args:
            node_id: Node ID to remove
            
        Returns:
            True if node was removed
        """
        if node_id not in self.nodes:
            logger.warning(f"Cannot remove non-existent node {node_id}")
            return False
        
        # Check if node has active jobs
        for job_id, job in self.active_jobs.items():
            if job.get("node_id") == node_id:
                logger.warning(f"Cannot remove node {node_id} with active job {job_id}")
                return False
        
        # Remove node
        node = self.nodes.pop(node_id)
        
        # Save nodes to state file
        self._save_nodes()
        
        logger.info(f"Removed node {node_id} ({node.hostname}:{node.port})")
        return True
    
    def list_nodes(self) -> List[Dict[str, Any]]:
        """List all nodes and their status"""
        return [node.to_dict() for node in self.nodes.values()]
    
    def get_node(self, node_id: str) -> Optional[DistributedNode]:
        """Get a node by ID"""
        return self.nodes.get(node_id)
    
    def auto_discover_nodes(self, subnet: str, ports: List[int] = None) -> List[str]:
        """
        Auto-discover nodes on the network
        
        Args:
            subnet: Subnet to scan (e.g., "192.168.1.")
            ports: Ports to check (default: from config)
            
        Returns:
            List of discovered node IDs
        """
        if not self.config["coordinator"]["auto_discovery"]:
            logger.warning("Auto-discovery is disabled in configuration")
            return []
        
        if ports is None:
            ports = self.config["coordinator"]["discovery_ports"]
        
        discovered_nodes = []
        
        # Simple ping scan (not very efficient but works for small networks)
        for i in range(1, 255):
            ip = f"{subnet}{i}"
            
            # Check if host is reachable
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(0.1)
                result = sock.connect_ex((ip, 22))
                sock.close()
                
                if result == 0:
                    # Host is reachable, try to add as node
                    node_id = self.add_node(
                        hostname=ip,
                        initialize=False
                    )
                    
                    if node_id:
                        discovered_nodes.append(node_id)
            except Exception:
                pass
        
        return discovered_nodes
    
    def _monitor_nodes(self) -> None:
        """Background thread to monitor node status"""
        heartbeat_interval = self.config["coordinator"]["heartbeat_interval"]
        job_check_interval = self.config["coordinator"]["job_check_interval"]
        
        last_heartbeat = 0
        last_job_check = 0
        
        while not self.shutdown_flag:
            current_time = time.time()
            
            # Check node heartbeats
            if current_time - last_heartbeat >= heartbeat_interval:
                for node_id, node in self.nodes.items():
                    if node.status != "error":
                        connected = node.check_connection()
                        if not connected and node.status != "error":
                            logger.warning(f"Node {node_id} ({node.hostname}) is not responding")
                            node.status = "error"
                
                last_heartbeat = current_time
                self._save_nodes()
            
            # Check job status
            if current_time - last_job_check >= job_check_interval:
                for job_id, job in list(self.active_jobs.items()):
                    node_id = job.get("node_id")
                    if node_id in self.nodes:
                        job_status = self._check_job_status(job_id, self.nodes[node_id])
                        
                        if job_status == "completed":
                            # Job completed, move to completed jobs
                            self.completed_jobs[job_id] = self.active_jobs.pop(job_id)
                            self.completed_jobs[job_id]["completion_time"] = time.time()
                            
                            # Update node status
                            self.nodes[node_id].status = "active"
                            self.nodes[node_id].current_job = None
                            
                            logger.info(f"Job {job_id} completed on node {node_id}")
                            
                            # Fetch results if available
                            self._fetch_job_results(job_id, self.nodes[node_id])
                    else:
                        # Node no longer exists, mark job as failed
                        self.active_jobs[job_id]["status"] = "failed"
                        self.active_jobs[job_id]["end_time"] = time.time()
                        self.completed_jobs[job_id] = self.active_jobs.pop(job_id)
                        
                        logger.warning(f"Job {job_id} failed: node {node_id} no longer exists")
                
                last_job_check = current_time
                self._save_jobs()
            
            # Sleep to avoid busy waiting
            time.sleep(1)
    
    def _check_job_status(self, job_id: str, node: DistributedNode) -> str:
        """
        Check the status of a job on a node
        
        Args:
            job_id: Job ID to check
            node: Node running the job
            
        Returns:
            Status string ("running", "completed", "failed", "unknown")
        """
        # Check if job's status file exists
        return_code, stdout, stderr = node.execute_command(f"cat ~/monte_carlo_simulations/{job_id}/status.txt 2>/dev/null || echo 'unknown'")
        
        if return_code != 0:
            return "unknown"
        
        status = stdout.strip()
        
        if status == "running":
            # Job is still running
            return "running"
        elif status == "completed":
            # Job completed successfully
            return "completed"
        elif status == "failed":
            # Job failed
            return "failed"
        else:
            # Unknown status
            return "unknown"
    
    def _fetch_job_results(self, job_id: str, node: DistributedNode) -> bool:
        """
        Fetch results for a completed job
        
        Args:
            job_id: Job ID to fetch results for
            node: Node that ran the job
            
        Returns:
            True if results were fetched successfully
        """
        # Create directory for results
        results_dir = self.storage_dir / "results" / job_id
        os.makedirs(results_dir, exist_ok=True)
        
        # Use SCP to copy results
        scp_cmd = ["scp"]
        
        # Add SSH options
        if node.port != 22:
            scp_cmd.extend(["-P", str(node.port)])
        
        if node.ssh_key_path:
            scp_cmd.extend(["-i", node.ssh_key_path])
        
        scp_cmd.extend([
            "-r",
            f"{node.username if node.username else ''}{'@' if node.username else ''}{node.hostname}:~/monte_carlo_simulations/{job_id}/results/*",
            str(results_dir)
        ])
        
        try:
            subprocess.run(scp_cmd, check=True)
            logger.info(f"Fetched results for job {job_id} to {results_dir}")
            
            # Update job record with result path
            if job_id in self.completed_jobs:
                self.completed_jobs[job_id]["results_path"] = str(results_dir)
                self._save_jobs()
            
            return True
        except Exception as e:
            logger.error(f"Error fetching results for job {job_id}: {e}")
            return False
    
    def submit_simulation_job(
        self,
        simulation_config: Dict[str, Any],
        variables: Dict[str, Any],
        correlations: Optional[np.ndarray] = None,
        iterations: int = 100000,
        sampling_method: str = "latin_hypercube",
        node_id: Optional[str] = None,
        output_dir: Optional[str] = None
    ) -> Optional[str]:
        """
        Submit a simulation job to a node
        
        Args:
            simulation_config: Simulation configuration
            variables: Variable definitions
            correlations: Correlation matrix (optional)
            iterations: Number of iterations
            sampling_method: Sampling method
            node_id: Specific node ID (optional, otherwise auto-select)
            output_dir: Directory for results (optional)
            
        Returns:
            Job ID if submission successful, None if failed
        """
        # Select node if not specified
        if node_id is None:
            node = self._select_best_node()
            if node is None:
                logger.error("No suitable nodes available for simulation job")
                return None
        else:
            if node_id not in self.nodes:
                logger.error(f"Node {node_id} does not exist")
                return None
            
            node = self.nodes[node_id]
            
            if node.status != "active" or not node.connected:
                logger.error(f"Node {node_id} is not active or not connected")
                return None
        
        # Generate job ID
        job_id = f"sim_{uuid.uuid4().hex[:10]}"
        
        # Prepare job configuration
        job_config = {
            "job_id": job_id,
            "simulation_config": simulation_config,
            "variables": variables,
            "iterations": iterations,
            "sampling_method": sampling_method,
            "output_format": self.config["simulation"]["result_format"]
        }
        
        if correlations is not None:
            job_config["correlations"] = correlations.tolist()
        
        # Create job directory on node
        node.execute_command(f"mkdir -p ~/monte_carlo_simulations/{job_id}/results")
        
        # Write job configuration to file
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
            json.dump(job_config, tmp, indent=2)
            tmp_path = tmp.name
        
        # Copy job configuration to node
        scp_cmd = ["scp"]
        
        # Add SSH options
        if node.port != 22:
            scp_cmd.extend(["-P", str(node.port)])
        
        if node.ssh_key_path:
            scp_cmd.extend(["-i", node.ssh_key_path])
        
        scp_cmd.extend([
            tmp_path,
            f"{node.username if node.username else ''}{'@' if node.username else ''}{node.hostname}:~/monte_carlo_simulations/{job_id}/config.json"
        ])
        
        try:
            subprocess.run(scp_cmd, check=True)
        except Exception as e:
            logger.error(f"Error copying job configuration to node {node.node_id}: {e}")
            os.unlink(tmp_path)
            return None
        
        # Create wrapper script
        with tempfile.NamedTemporaryFile(mode='w', delete=False) as tmp:
            tmp.write(f"""#!/bin/bash
cd ~/monte_carlo_simulations/{job_id}
echo "running" > status.txt

# Run the simulation
python3 -c '
import sys
import os
import json
import time
import numpy as np

try:
    # Load configuration
    with open("config.json", "r") as f:
        config = json.load(f)
    
    # Import necessary modules
    import torch
    from scipy.stats import norm
    
    # Setup variables
    sampling_method = config["sampling_method"]
    iterations = config["iterations"]
    variables = config["variables"]
    
    # Setup correlation matrix if provided
    if "correlations" in config:
        correlations = np.array(config["correlations"])
    else:
        correlations = np.eye(len(variables))
    
    # Initialize results
    results = {{
        "job_id": config["job_id"],
        "start_time": time.time(),
        "iterations": iterations,
        "sampling_method": sampling_method,
        "status": "running"
    }}
    
    # Check if CUDA is available
    cuda_available = torch.cuda.is_available()
    if cuda_available:
        device = torch.device("cuda:0")
        results["device"] = "cuda"
        results["device_name"] = torch.cuda.get_device_name(0)
    else:
        device = torch.device("cpu")
        results["device"] = "cpu"
    
    # Run simulation
    start_time = time.time()
    
    # Create simulation outputs
    outputs = {{}}
    
    # Process in batches
    batch_size = 10000
    num_batches = (iterations + batch_size - 1) // batch_size
    
    for i in range(num_batches):
        current_batch_size = min(batch_size, iterations - i * batch_size)
        
        # Progress update
        if i % 10 == 0:
            print(f"Processing batch {{i+1}}/{{num_batches}}")
            
        # Generate random samples for all variables
        if cuda_available:
            # PyTorch implementation
            Z = torch.randn(current_batch_size, len(variables), device=device)
            
            # Apply correlation
            corr_tensor = torch.tensor(correlations, device=device)
            try:
                L = torch.linalg.cholesky(corr_tensor)
                Z = torch.matmul(Z, L.T)
            except:
                # If Cholesky decomposition fails, use uncorrelated samples
                pass
            
            # Process each variable
            samples = {{}}
            for idx, (name, var_config) in enumerate(variables.items()):
                dist_type = var_config["distribution"]
                params = var_config["params"]
                
                if dist_type == "normal":
                    mu = params.get("mu", 0.0)
                    sigma = params.get("sigma", 1.0)
                    samples[name] = mu + sigma * Z[:, idx]
                elif dist_type == "uniform":
                    a = params.get("a", 0.0)
                    b = params.get("b", 1.0)
                    u = 0.5 * (1 + torch.erf(Z[:, idx] / 1.414))
                    samples[name] = a + (b - a) * u
                else:
                    # Default to standard normal
                    samples[name] = Z[:, idx]
        else:
            # NumPy implementation
            Z = np.random.standard_normal(size=(current_batch_size, len(variables)))
            
            # Apply correlation
            try:
                L = np.linalg.cholesky(correlations)
                Z = Z @ L.T
            except:
                # If Cholesky decomposition fails, use uncorrelated samples
                pass
                
            # Process each variable
            samples = {{}}
            for idx, (name, var_config) in enumerate(variables.items()):
                dist_type = var_config["distribution"]
                params = var_config["params"]
                
                if dist_type == "normal":
                    mu = params.get("mu", 0.0)
                    sigma = params.get("sigma", 1.0)
                    samples[name] = mu + sigma * Z[:, idx]
                elif dist_type == "uniform":
                    a = params.get("a", 0.0)
                    b = params.get("b", 1.0)
                    u = norm.cdf(Z[:, idx])
                    samples[name] = a + (b - a) * u
                else:
                    # Default to standard normal
                    samples[name] = Z[:, idx]
        
        # Simulate tariff impact as an example
        if "tariff_rate" in samples:
            if cuda_available:
                # Move to CPU for calculation to avoid memory issues
                tariff_rate = samples["tariff_rate"].cpu().numpy()
            else:
                tariff_rate = samples["tariff_rate"]
            
            # Example calculations
            baseline_revenue = 60000000000  # Example value
            us_export_pct = 35.0  # Example value
            revenue_at_risk = baseline_revenue * (us_export_pct / 100.0)
            
            # Calculate impact
            direct_impact = revenue_at_risk * (tariff_rate / 100.0)
            
            # Store in outputs
            if "direct_impact" not in outputs:
                outputs["direct_impact"] = []
            
            outputs["direct_impact"].append(direct_impact)
            
        # Save checkpoint periodically
        if (i + 1) % 20 == 0 or i == num_batches - 1:
            # Calculate statistics for each output
            stats = {{}}
            for output_name, output_data in outputs.items():
                if output_data:
                    # Combine all batches
                    combined = np.concatenate(output_data)
                    
                    # Calculate statistics
                    stats[output_name] = {{
                        "mean": float(np.mean(combined)),
                        "std": float(np.std(combined)),
                        "min": float(np.min(combined)),
                        "max": float(np.max(combined)),
                        "q05": float(np.percentile(combined, 5)),
                        "q50": float(np.percentile(combined, 50)),
                        "q95": float(np.percentile(combined, 95))
                    }}
            
            # Update results
            results["statistics"] = stats
            results["progress"] = (i + 1) / num_batches
            results["processed_iterations"] = min((i + 1) * batch_size, iterations)
            
            # Save checkpoint
            with open(f"results/checkpoint_{i+1}.json", "w") as f:
                json.dump(results, f, indent=2)
    
    # Finalize results
    end_time = time.time()
    computation_time = end_time - start_time
    
    results["end_time"] = end_time
    results["computation_time"] = computation_time
    results["iterations_per_second"] = iterations / computation_time if computation_time > 0 else 0
    results["status"] = "completed"
    
    # Save final results
    with open("results/final_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    # Update status
    with open("status.txt", "w") as f:
        f.write("completed")
        
    print(f"Simulation completed in {computation_time:.2f} seconds")

except Exception as e:
    # Log error
    with open("error.log", "w") as f:
        f.write(f"Error: {str(e)}")
    
    # Update status
    with open("status.txt", "w") as f:
        f.write("failed")
    
    print(f"Simulation failed: {str(e)}")
    sys.exit(1)
'

if [ $? -ne 0 ]; then
    echo "failed" > status.txt
    exit 1
fi

# End of script
exit 0
""")
            script_path = tmp.name
        
        # Make script executable
        os.chmod(script_path, 0o755)
        
        # Copy script to node
        scp_cmd = ["scp"]
        
        # Add SSH options
        if node.port != 22:
            scp_cmd.extend(["-P", str(node.port)])
        
        if node.ssh_key_path:
            scp_cmd.extend(["-i", node.ssh_key_path])
        
        scp_cmd.extend([
            script_path,
            f"{node.username if node.username else ''}{'@' if node.username else ''}{node.hostname}:~/monte_carlo_simulations/{job_id}/run_simulation.sh"
        ])
        
        try:
            subprocess.run(scp_cmd, check=True)
        except Exception as e:
            logger.error(f"Error copying simulation script to node {node.node_id}: {e}")
            os.unlink(tmp_path)
            os.unlink(script_path)
            return None
        
        # Launch simulation script in background
        return_code, stdout, stderr = node.execute_command(f"cd ~/monte_carlo_simulations/{job_id} && nohup ./run_simulation.sh > simulation.log 2>&1 &")
        
        # Clean up temporary files
        os.unlink(tmp_path)
        os.unlink(script_path)
        
        if return_code != 0:
            logger.error(f"Error launching simulation on node {node.node_id}: {stderr}")
            return None
        
        # Update node status
        node.status = "busy"
        node.current_job = job_id
        
        # Create job record
        job_record = {
            "job_id": job_id,
            "node_id": node.node_id,
            "start_time": time.time(),
            "status": "running",
            "iterations": iterations,
            "sampling_method": sampling_method,
            "config": simulation_config
        }
        
        self.active_jobs[job_id] = job_record
        
        # Save state
        self._save_nodes()
        self._save_jobs()
        
        logger.info(f"Submitted job {job_id} to node {node.node_id} ({node.hostname})")
        return job_id
    
    def _select_best_node(self) -> Optional[DistributedNode]:
        """
        Select the best node for a job
        
        Returns:
            Best node, or None if no suitable nodes available
        """
        available_nodes = [
            node for node in self.nodes.values()
            if node.status == "active" and node.connected
        ]
        
        if not available_nodes:
            return None
        
        # Prefer GPU nodes over CPU nodes
        gpu_nodes = [node for node in available_nodes if node.num_gpus > 0]
        
        if gpu_nodes:
            # Sort by number of GPUs
            return sorted(gpu_nodes, key=lambda n: n.num_gpus, reverse=True)[0]
        else:
            # Sort by CPU cores
            return sorted(available_nodes, key=lambda n: n.cpu_cores, reverse=True)[0]
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get status of a job
        
        Args:
            job_id: Job ID to check
            
        Returns:
            Job status information
        """
        if job_id in self.active_jobs:
            return self.active_jobs[job_id]
        elif job_id in self.completed_jobs:
            return self.completed_jobs[job_id]
        else:
            return {"error": "Job not found"}
    
    def list_jobs(self, include_completed: bool = True) -> Dict[str, List[Dict[str, Any]]]:
        """
        List all jobs
        
        Args:
            include_completed: Whether to include completed jobs
            
        Returns:
            Dictionary with active and completed jobs
        """
        result = {
            "active": list(self.active_jobs.values())
        }
        
        if include_completed:
            result["completed"] = list(self.completed_jobs.values())
        
        return result
    
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a running job
        
        Args:
            job_id: Job ID to cancel
            
        Returns:
            True if job was cancelled
        """
        if job_id not in self.active_jobs:
            logger.warning(f"Cannot cancel non-existent or completed job {job_id}")
            return False
        
        job = self.active_jobs[job_id]
        node_id = job.get("node_id")
        
        if node_id not in self.nodes:
            logger.warning(f"Cannot cancel job {job_id}: node {node_id} no longer exists")
            
            # Mark job as failed
            job["status"] = "failed"
            job["end_time"] = time.time()
            self.completed_jobs[job_id] = self.active_jobs.pop(job_id)
            self._save_jobs()
            
            return True
        
        node = self.nodes[node_id]
        
        # Find and kill the job process
        return_code, stdout, stderr = node.execute_command(f"pkill -f 'monte_carlo_simulations/{job_id}'")
        
        # Update status file
        node.execute_command(f"echo 'cancelled' > ~/monte_carlo_simulations/{job_id}/status.txt")
        
        # Update job record
        job["status"] = "cancelled"
        job["end_time"] = time.time()
        self.completed_jobs[job_id] = self.active_jobs.pop(job_id)
        
        # Update node status
        node.status = "active"
        node.current_job = None
        
        # Save state
        self._save_nodes()
        self._save_jobs()
        
        logger.info(f"Cancelled job {job_id} on node {node_id}")
        return True
    
    def get_job_results(self, job_id: str) -> Dict[str, Any]:
        """
        Get results for a completed job
        
        Args:
            job_id: Job ID to get results for
            
        Returns:
            Job results or error information
        """
        if job_id not in self.completed_jobs:
            if job_id in self.active_jobs:
                return {"error": "Job is still running"}
            else:
                return {"error": "Job not found"}
        
        job = self.completed_jobs[job_id]
        results_path = job.get("results_path")
        
        if not results_path or not os.path.exists(results_path):
            return {"error": "Results not available"}
        
        # Load final results if available
        final_results_path = os.path.join(results_path, "final_results.json")
        if os.path.exists(final_results_path):
            try:
                with open(final_results_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                return {"error": f"Error loading results: {e}"}
        
        # Otherwise return latest checkpoint
        checkpoint_files = sorted([
            f for f in os.listdir(results_path) if f.startswith("checkpoint_")
        ])
        
        if checkpoint_files:
            latest_checkpoint = checkpoint_files[-1]
            try:
                with open(os.path.join(results_path, latest_checkpoint), 'r') as f:
                    return json.load(f)
            except Exception as e:
                return {"error": f"Error loading checkpoint: {e}"}
        
        return {"error": "No results available"}
    
    def shutdown(self) -> None:
        """Shut down the coordinator"""
        logger.info("Shutting down distributed coordinator")
        
        # Signal monitor thread to stop
        self.shutdown_flag = True
        
        # Wait for monitor thread to finish
        if self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
        
        # Save final state
        self._save_nodes()
        self._save_jobs()
        
        logger.info("Distributed coordinator shutdown complete")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Distributed Monte Carlo Simulation Coordinator")
    parser.add_argument("--config", help="Path to configuration file")
    parser.add_argument("--storage", help="Path to storage directory")
    parser.add_argument("--add-node", help="Add a new node (hostname:port)")
    parser.add_argument("--list-nodes", action="store_true", help="List all nodes")
    parser.add_argument("--list-jobs", action="store_true", help="List all jobs")
    parser.add_argument("--setup-script", help="Path to node setup script")
    
    args = parser.parse_args()
    
    # Create coordinator
    coordinator = DistributedCoordinator(
        config_path=args.config,
        storage_dir=args.storage
    )
    
    try:
        if args.add_node:
            # Parse hostname and port
            parts = args.add_node.split(":")
            hostname = parts[0]
            port = int(parts[1]) if len(parts) > 1 else 22
            
            # Add node
            node_id = coordinator.add_node(
                hostname=hostname,
                port=port,
                setup_script_path=args.setup_script
            )
            
            if node_id:
                print(f"Added node {node_id} ({hostname}:{port})")
            else:
                print(f"Failed to add node {hostname}:{port}")
                sys.exit(1)
        
        if args.list_nodes:
            nodes = coordinator.list_nodes()
            print(f"\nAvailable Nodes ({len(nodes)}):")
            for node in nodes:
                print(f"  {node['node_id']}: {node['hostname']}:{node['port']} - {node['status']}")
                print(f"    GPUs: {node['num_gpus']}, CPU Cores: {node['cpu_cores']}")
                print(f"    Current Job: {node['current_job'] or 'None'}")
                print()
        
        if args.list_jobs:
            jobs = coordinator.list_jobs()
            print(f"\nActive Jobs ({len(jobs['active'])}):")
            for job in jobs['active']:
                print(f"  {job['job_id']} - Node: {job['node_id']}, Status: {job['status']}")
                print(f"    Started: {time.ctime(job['start_time'])}")
                print(f"    Iterations: {job.get('iterations', 'Unknown')}")
                print()
            
            print(f"\nCompleted Jobs ({len(jobs['completed'])}):")
            for job in jobs['completed']:
                print(f"  {job['job_id']} - Node: {job['node_id']}, Status: {job['status']}")
                print(f"    Started: {time.ctime(job['start_time'])}")
                print(f"    Completed: {time.ctime(job['end_time']) if 'end_time' in job else 'Unknown'}")
                print()
    
    finally:
        # Shutdown coordinator
        coordinator.shutdown()