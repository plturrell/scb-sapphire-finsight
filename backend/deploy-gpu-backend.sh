#!/bin/bash
# Deploy GPU-enabled backend to a cloud provider with Advanced Monte Carlo API

# Colors and formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}=====================================${NC}"
echo -e "${BLUE}${BOLD}  Sapphire FinSight Advanced Monte Carlo Deployment  ${NC}"
echo -e "${BLUE}${BOLD}=====================================${NC}"

# Parse command line arguments
MULTI_GPU=false
PERFORMANCE_PROFILE="balanced"
DISTRIBUTED=false
NODE_COUNT=1
USE_GPUS=true

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --multi-gpu)
      MULTI_GPU=true
      shift
      ;;
    --distributed)
      DISTRIBUTED=true
      shift
      ;;
    --nodes)
      NODE_COUNT="$2"
      shift
      shift
      ;;
    --profile)
      PERFORMANCE_PROFILE="$2"
      shift
      shift
      ;;
    --no-gpu)
      USE_GPUS=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Configuration
PROJECT_NAME="sapphire-finsight"
REGISTRY_URL="your-registry-url.com"  # Replace with your container registry
GCP_PROJECT="your-gcp-project"        # Replace with your GCP project
GCP_ZONE="us-central1-a"              # Replace with your preferred zone

# Select machine type and GPU based on requirements
if [ "$USE_GPUS" = true ]; then
  if [ "$MULTI_GPU" = true ]; then
    MACHINE_TYPE="n1-standard-8"
    GPU_TYPE="nvidia-tesla-v100"
    GPU_COUNT=4
  else
    MACHINE_TYPE="n1-standard-4"
    GPU_TYPE="nvidia-tesla-t4"
    GPU_COUNT=1
  fi
else
  MACHINE_TYPE="n1-standard-4"
  GPU_TYPE=""
  GPU_COUNT=0
fi

# Print configuration
echo -e "${YELLOW}Deployment Configuration:${NC}"
echo -e "  - Machine Type: ${BOLD}${MACHINE_TYPE}${NC}"
if [ "$USE_GPUS" = true ]; then
  echo -e "  - GPU Type: ${BOLD}${GPU_TYPE}${NC}"
  echo -e "  - GPU Count: ${BOLD}${GPU_COUNT}${NC}"
  echo -e "  - Multi-GPU Mode: ${BOLD}${MULTI_GPU}${NC}"
else
  echo -e "  - CPU-only Mode: ${BOLD}Enabled${NC}"
fi
echo -e "  - Performance Profile: ${BOLD}${PERFORMANCE_PROFILE}${NC}"
echo -e "  - Distributed Mode: ${BOLD}${DISTRIBUTED}${NC}"
if [ "$DISTRIBUTED" = true ]; then
  echo -e "  - Node Count: ${BOLD}${NODE_COUNT}${NC}"
fi
echo

# Step 1: Build Docker image with appropriate tags
echo -e "${YELLOW}Building Docker image...${NC}"
if [ "$MULTI_GPU" = true ]; then
  TARGET="multi-gpu"
elif [ "$DISTRIBUTED" = true ]; then
  TARGET="distributed"
else
  TARGET="standard"
fi

# Choose the appropriate Dockerfile
if [ -f "Dockerfile.${TARGET}" ]; then
  DOCKERFILE="Dockerfile.${TARGET}"
else
  DOCKERFILE="Dockerfile"
fi

echo -e "${YELLOW}Using ${DOCKERFILE} for build...${NC}"
VERSION=$(date +"%Y%m%d%H%M")
IMAGE_TAG="${PROJECT_NAME}-backend:${VERSION}"

docker build -t ${IMAGE_TAG} -f ${DOCKERFILE} .

# Step 2: Tag the image for your registry
echo -e "${YELLOW}Tagging image for registry...${NC}"
REGISTRY_TAG="${REGISTRY_URL}/${PROJECT_NAME}-backend:${VERSION}"
docker tag ${IMAGE_TAG} ${REGISTRY_TAG}
docker tag ${IMAGE_TAG} "${REGISTRY_URL}/${PROJECT_NAME}-backend:latest"

# Step 3: Push to container registry
echo -e "${YELLOW}Pushing image to registry...${NC}"
docker push ${REGISTRY_TAG}
docker push "${REGISTRY_URL}/${PROJECT_NAME}-backend:latest"

# Step 4: Deploy to cloud (GCP example)
echo -e "${YELLOW}Deploying to GCP with Advanced Monte Carlo support...${NC}"

# Create environment variables for the container
ENV_VARS="-e \"USE_GPU_ACCELERATION=${USE_GPUS}\" -e \"MONTE_CARLO_PROFILE=${PERFORMANCE_PROFILE}\" -e \"ANALYSIS_RESULTS_PATH=/app/results\""

if [ "$MULTI_GPU" = true ]; then
  ENV_VARS="${ENV_VARS} -e \"MULTI_GPU_ENABLED=true\""
fi

if [ "$DISTRIBUTED" = true ]; then
  ENV_VARS="${ENV_VARS} -e \"DISTRIBUTED_MODE_ENABLED=true\" -e \"NODE_COUNT=${NODE_COUNT}\""
fi

# GPU configuration for GCP
GPU_CONFIG=""
if [ "$USE_GPUS" = true ] && [ "$GPU_COUNT" -gt 0 ]; then
  GPU_CONFIG="--accelerator=type=${GPU_TYPE},count=${GPU_COUNT}"
fi

# For GCP, create a Compute Engine instance
INSTANCE_NAME="${PROJECT_NAME}-backend"
if [ "$DISTRIBUTED" = true ]; then
  # For distributed mode, we'll create multiple instances
  for i in $(seq 1 ${NODE_COUNT}); do
    NODE_NAME="${INSTANCE_NAME}-node${i}"
    
    echo -e "${YELLOW}Creating node ${i}/${NODE_COUNT}: ${NODE_NAME}...${NC}"
    
    # Add node-specific environment variables
    NODE_ENV_VARS="${ENV_VARS} -e \"NODE_ID=${i}\" -e \"TOTAL_NODES=${NODE_COUNT}\""
    
    # For the first node, make it the coordinator
    if [ "$i" -eq 1 ]; then
      NODE_ENV_VARS="${NODE_ENV_VARS} -e \"IS_COORDINATOR=true\""
      COORDINATOR_NAME="${NODE_NAME}"
    else
      NODE_ENV_VARS="${NODE_ENV_VARS} -e \"IS_COORDINATOR=false\" -e \"COORDINATOR_HOST=${COORDINATOR_NAME}\""
    fi
    
    gcloud compute instances create ${NODE_NAME} \
      --project=${GCP_PROJECT} \
      --zone=${GCP_ZONE} \
      --machine-type=${MACHINE_TYPE} \
      ${GPU_CONFIG} \
      --boot-disk-size=50GB \
      --boot-disk-type=pd-ssd \
      --image-family=cos-stable \
      --image-project=cos-cloud \
      --maintenance-policy=TERMINATE \
      --restart-on-failure \
      --metadata=startup-script="
        docker run -d --name sapphire-backend \
          --restart unless-stopped \
          $([ "$USE_GPUS" = true ] && echo "--gpus all" || echo "") \
          -p 80:8888 \
          ${NODE_ENV_VARS} \
          ${REGISTRY_TAG}
      "
  done
  
  # Get the external IP of the coordinator
  EXTERNAL_IP=$(gcloud compute instances describe ${COORDINATOR_NAME} --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
  
else
  # For single-node mode
  gcloud compute instances create ${INSTANCE_NAME} \
    --project=${GCP_PROJECT} \
    --zone=${GCP_ZONE} \
    --machine-type=${MACHINE_TYPE} \
    ${GPU_CONFIG} \
    --boot-disk-size=50GB \
    --boot-disk-type=pd-ssd \
    --image-family=cos-stable \
    --image-project=cos-cloud \
    --maintenance-policy=TERMINATE \
    --restart-on-failure \
    --metadata=startup-script="
      docker run -d --name sapphire-backend \
        --restart unless-stopped \
        $([ "$USE_GPUS" = true ] && echo "--gpus all" || echo "") \
        -p 80:8888 \
        ${ENV_VARS} \
        ${REGISTRY_TAG}
    "
  
  # Get the external IP
  EXTERNAL_IP=$(gcloud compute instances describe ${INSTANCE_NAME} --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
fi

echo -e "${GREEN}${BOLD}=====================================${NC}"
echo -e "${GREEN}${BOLD}  Deployment Complete!  ${NC}"
echo -e "${GREEN}${BOLD}=====================================${NC}"
echo -e "Backend API: ${BOLD}http://${EXTERNAL_IP}${NC}"
echo -e "Health Check: ${BOLD}http://${EXTERNAL_IP}/health${NC}"
echo -e "API Capabilities: ${BOLD}http://${EXTERNAL_IP}/api/capabilities${NC}"
echo -e "\nAdvanced Monte Carlo API:"
echo -e "Status: ${BOLD}http://${EXTERNAL_IP}/api/advanced-monte-carlo/status${NC}"

if [ "$DISTRIBUTED" = true ]; then
  echo -e "\nDistributed Mode Information:"
  echo -e "Coordinator: ${BOLD}${COORDINATOR_NAME}${NC}"
  echo -e "Total Nodes: ${BOLD}${NODE_COUNT}${NC}"
fi

echo -e "\nNote: It may take a few minutes for the instance(s) to fully start up."
echo -e "You can check the status with: gcloud compute instances get-serial-port-output ${INSTANCE_NAME}"