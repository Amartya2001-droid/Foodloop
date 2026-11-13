// Local verification fixtures only; never imports database storage or seed.ts.
import express from 'express';
import { storage } from '../../server/storage';
import { registerRoutes } from '../../server/routes';
const user = await storage.createUser({ username: 'verification-supplier', password: 'noncredential-test-value' });
const org = await storage.createOrganization({ ownerId: user.id, name: 'Verification organization', type: 'food_bank', description: 'Ephemeral fixture', location: 'Local test', latitude: 0, longitude: 0, contactEmail: 'fixture@example.invalid', contactPhone: 'not-a-phone' });
await storage.createSupplierRating({ supplierId: user.id, organizationId: org.id, overallRating: 1, reliabilityScore: 1, qualityScore: 1 });
await storage.createFoodListing({ organizationId: org.id, donorId: user.id, title: 'Fixture donation', description: 'Local only', quantity: '1 item', category: 'other', location: 'Local', latitude: 0, longitude: 0, freshnessScore: 0, qualityScore: 0 });
const app = express();
app.use(express.json());
const server = await registerRoutes(app);
server.listen(5125, '127.0.0.1');
