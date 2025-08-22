-- Enable row level security on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to access only rows from their tenant
CREATE POLICY user_tenant_isolation ON "User"
  USING ("tenantId" = current_setting('app.tenant_id')::int);
