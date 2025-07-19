import app from "./src/app";

function startServer() {
  try {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`[/index.ts]-> Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("[/index.ts]-> Error starting server:", error);
    process.exit(1);
  }
}

startServer();
