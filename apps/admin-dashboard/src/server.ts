// apps/admin-dashboard/src/server.ts
import app from "./app";

const PORT = process.env.ADMIN_PORT || 3001;

app.listen(PORT, () => {
  console.log(`Admin Dashboard backend listening on port ${PORT}`);
});
