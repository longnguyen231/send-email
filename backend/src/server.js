import app from './app.js';
import { appConfig } from './config/env.js';

const { port } = appConfig;

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
