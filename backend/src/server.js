const app = require("./app");
const env = require("./core/config/env");
const accessControlService = require("./core/services/accessControl.service");

async function start() {
  await accessControlService.syncDefaultAccessCatalog({
    resetRolePermissions: false,
  });

  const server = app.listen(env.port, () => {
    console.log(`KRUNCUY POS API running on port ${env.port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${env.port} is already in use. Stop the other KRUNCUY POS API process first.`);
      process.exit(1);
    }

    console.error("Failed to bind KRUNCUY POS API server", error);
    process.exit(1);
  });
}

start().catch((error) => {
  console.error("Failed to start KRUNCUY POS API", error);
  process.exit(1);
});
