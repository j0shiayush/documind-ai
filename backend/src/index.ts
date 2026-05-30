# Placeholder entry point

cat > src/index.ts << 'EOF'
// Entry point for local ts-node-dev usage (not needed for langgraph:dev)
console.log("Backend running. Use 'yarn langgraph:dev' for LangGraph server.");
EOF