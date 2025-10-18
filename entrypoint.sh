#!/bin/bash

# Check if the model is already downloaded
if [ ! -f "/root/.ollama/models/llama3.2" ]; then
  echo "Model not found. Downloading..."
  ollama pull llama3.2
else
  echo "Model already exists. Skipping download."
fi


# Start the Ollama service
exec "$@"